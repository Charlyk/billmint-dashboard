-- Function to list invoices with pagination and filters

CREATE OR REPLACE FUNCTION list_invoices(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_client_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_data JSON;
    v_result JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get total count
    SELECT COUNT(*) INTO v_total
    FROM invoices i
    WHERE i.user_id = p_user_id
        AND (p_client_id IS NULL OR i.client_id = p_client_id)
        AND (p_status IS NULL OR i.status = p_status)
        AND (p_start_date IS NULL OR i.issue_date::DATE >= p_start_date)
        AND (p_end_date IS NULL OR i.issue_date::DATE <= p_end_date);

    -- Get paginated data with client info
    SELECT COALESCE(json_agg(invoice_data ORDER BY issue_date DESC), '[]'::json)
    INTO v_data
    FROM (
        SELECT
            i.*,
            CASE
                WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name, 'email', c.email)
                ELSE NULL
            END as client
        FROM invoices i
        LEFT JOIN clients c ON c.id = i.client_id
        WHERE i.user_id = p_user_id
            AND (p_client_id IS NULL OR i.client_id = p_client_id)
            AND (p_status IS NULL OR i.status = p_status)
            AND (p_start_date IS NULL OR i.issue_date::DATE >= p_start_date)
            AND (p_end_date IS NULL OR i.issue_date::DATE <= p_end_date)
        ORDER BY i.issue_date DESC
        LIMIT p_limit OFFSET v_offset
    ) invoice_data;

    -- Build result
    SELECT json_build_object(
        'data', v_data,
        'pagination', json_build_object(
            'page', p_page,
            'limit', p_limit,
            'total', v_total,
            'totalPages', CEIL(v_total::NUMERIC / p_limit)
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get invoice with all details (client + line items)

CREATE OR REPLACE FUNCTION get_invoice_with_details(
    p_user_id UUID,
    p_invoice_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_result JSON;
BEGIN
    -- Get invoice with client
    SELECT
        i.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email) as client_json
    INTO v_invoice
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.id = p_invoice_id AND i.user_id = p_user_id;

    IF v_invoice.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Invoice not found';
    END IF;

    -- Build result with line items
    SELECT json_build_object(
        'id', v_invoice.id,
        'user_id', v_invoice.user_id,
        'client_id', v_invoice.client_id,
        'invoice_number', v_invoice.invoice_number,
        'status', v_invoice.status,
        'issue_date', v_invoice.issue_date,
        'due_date', v_invoice.due_date,
        'paid_date', v_invoice.paid_date,
        'sent_at', v_invoice.sent_at,
        'reminder_sent_at', v_invoice.reminder_sent_at,
        'subtotal', v_invoice.subtotal,
        'tax_rate', v_invoice.tax_rate,
        'tax_amount', v_invoice.tax_amount,
        'discount_amount', v_invoice.discount_amount,
        'total', v_invoice.total,
        'currency', v_invoice.currency,
        'notes', v_invoice.notes,
        'terms', v_invoice.terms,
        'public_token', v_invoice.public_token,
        'created_at', v_invoice.created_at,
        'updated_at', v_invoice.updated_at,
        'client', v_invoice.client_json,
        'line_items', COALESCE((
            SELECT json_agg(li ORDER BY li.sort_order)
            FROM invoice_line_items li
            WHERE li.invoice_id = p_invoice_id
        ), '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to create invoice with line items atomically

CREATE OR REPLACE FUNCTION create_invoice(
    p_user_id UUID,
    p_client_id UUID,
    p_invoice_number TEXT DEFAULT NULL,
    p_issue_date TIMESTAMPTZ DEFAULT NOW(),
    p_due_date TIMESTAMPTZ DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_terms TEXT DEFAULT NULL,
    p_tax_rate NUMERIC DEFAULT 0,
    p_discount_amount NUMERIC DEFAULT 0,
    p_line_items JSONB DEFAULT '[]'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_invoice_number TEXT;
    v_prefix TEXT;
    v_count INTEGER;
    v_subtotal NUMERIC := 0;
    v_tax_amount NUMERIC;
    v_total NUMERIC;
    v_currency TEXT := 'USD';
    v_public_token TEXT;
    v_invoice_id UUID;
    v_invoice RECORD;
    v_item JSONB;
    v_index INTEGER := 0;
    v_time_entry_ids UUID[];
    v_result JSON;
BEGIN
    -- Generate invoice number if not provided
    IF p_invoice_number IS NULL OR p_invoice_number = '' THEN
        SELECT COALESCE(invoice_prefix, 'INV-') INTO v_prefix
        FROM user_settings
        WHERE user_id = p_user_id;

        v_prefix := COALESCE(v_prefix, 'INV-');

        SELECT COUNT(*) INTO v_count
        FROM invoices
        WHERE user_id = p_user_id;

        v_invoice_number := v_prefix || LPAD((v_count + 1)::TEXT, 4, '0');
    ELSE
        v_invoice_number := p_invoice_number;
    END IF;

    -- Calculate subtotal from line items
    SELECT COALESCE(SUM((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC), 0)
    INTO v_subtotal
    FROM jsonb_array_elements(p_line_items) AS item;

    -- Calculate tax and total
    v_tax_amount := ROUND(v_subtotal * (p_tax_rate / 100), 2);
    v_total := v_subtotal + v_tax_amount - COALESCE(p_discount_amount, 0);

    -- Get currency from client's first project
    SELECT p.currency INTO v_currency
    FROM projects p
    WHERE p.client_id = p_client_id
    LIMIT 1;
    v_currency := COALESCE(v_currency, 'USD');

    -- Generate public token
    v_public_token := encode(gen_random_bytes(24), 'base64');
    v_public_token := replace(replace(replace(v_public_token, '+', ''), '/', ''), '=', '');

    -- Create invoice
    INSERT INTO invoices (
        user_id,
        client_id,
        invoice_number,
        issue_date,
        due_date,
        notes,
        terms,
        tax_rate,
        tax_amount,
        discount_amount,
        subtotal,
        total,
        currency,
        public_token,
        status
    ) VALUES (
        p_user_id,
        p_client_id,
        v_invoice_number,
        p_issue_date,
        p_due_date,
        p_notes,
        p_terms,
        p_tax_rate,
        v_tax_amount,
        p_discount_amount,
        v_subtotal,
        v_total,
        v_currency,
        v_public_token,
        'draft'
    )
    RETURNING id INTO v_invoice_id;

    -- Create line items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items)
    LOOP
        INSERT INTO invoice_line_items (
            invoice_id,
            description,
            quantity,
            unit_price,
            amount,
            time_entry_id,
            sort_order
        ) VALUES (
            v_invoice_id,
            v_item->>'description',
            (v_item->>'quantity')::NUMERIC,
            (v_item->>'unit_price')::NUMERIC,
            (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC,
            (v_item->>'time_entry_id')::UUID,
            v_index
        );

        -- Collect time entry IDs
        IF v_item->>'time_entry_id' IS NOT NULL THEN
            v_time_entry_ids := array_append(v_time_entry_ids, (v_item->>'time_entry_id')::UUID);
        END IF;

        v_index := v_index + 1;
    END LOOP;

    -- Mark time entries as invoiced
    IF array_length(v_time_entry_ids, 1) > 0 THEN
        UPDATE time_entries
        SET invoice_id = v_invoice_id, updated_at = NOW()
        WHERE id = ANY(v_time_entry_ids);
    END IF;

    -- Get complete invoice with details
    SELECT get_invoice_with_details(p_user_id, v_invoice_id) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to update invoice atomically

CREATE OR REPLACE FUNCTION update_invoice(
    p_user_id UUID,
    p_invoice_id UUID,
    p_invoice_number TEXT DEFAULT NULL,
    p_issue_date TIMESTAMPTZ DEFAULT NULL,
    p_due_date TIMESTAMPTZ DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_terms TEXT DEFAULT NULL,
    p_tax_rate NUMERIC DEFAULT NULL,
    p_discount_amount NUMERIC DEFAULT NULL,
    p_line_items JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_subtotal NUMERIC;
    v_tax_rate NUMERIC;
    v_tax_amount NUMERIC;
    v_discount_amount NUMERIC;
    v_total NUMERIC;
    v_item JSONB;
    v_index INTEGER := 0;
    v_time_entry_ids UUID[];
    v_result JSON;
BEGIN
    -- Get existing invoice
    SELECT * INTO v_invoice
    FROM invoices
    WHERE id = p_invoice_id AND user_id = p_user_id;

    IF v_invoice.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Invoice not found';
    END IF;

    IF v_invoice.status != 'draft' THEN
        RAISE EXCEPTION 'VALIDATION: Only draft invoices can be edited';
    END IF;

    -- Calculate new totals
    IF p_line_items IS NOT NULL THEN
        SELECT COALESCE(SUM((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC), 0)
        INTO v_subtotal
        FROM jsonb_array_elements(p_line_items) AS item;
    ELSE
        v_subtotal := v_invoice.subtotal;
    END IF;

    v_tax_rate := COALESCE(p_tax_rate, v_invoice.tax_rate);
    v_discount_amount := COALESCE(p_discount_amount, v_invoice.discount_amount);
    v_tax_amount := ROUND(v_subtotal * (v_tax_rate / 100), 2);
    v_total := v_subtotal + v_tax_amount - v_discount_amount;

    -- Update invoice
    UPDATE invoices
    SET
        invoice_number = COALESCE(p_invoice_number, invoice_number),
        issue_date = COALESCE(p_issue_date, issue_date),
        due_date = COALESCE(p_due_date, due_date),
        notes = COALESCE(p_notes, notes),
        terms = COALESCE(p_terms, terms),
        tax_rate = v_tax_rate,
        tax_amount = v_tax_amount,
        discount_amount = v_discount_amount,
        subtotal = v_subtotal,
        total = v_total,
        updated_at = NOW()
    WHERE id = p_invoice_id;

    -- Update line items if provided
    IF p_line_items IS NOT NULL THEN
        -- Unmark old time entries
        UPDATE time_entries
        SET invoice_id = NULL, updated_at = NOW()
        WHERE invoice_id = p_invoice_id;

        -- Delete old line items
        DELETE FROM invoice_line_items WHERE invoice_id = p_invoice_id;

        -- Create new line items
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_line_items)
        LOOP
            INSERT INTO invoice_line_items (
                invoice_id,
                description,
                quantity,
                unit_price,
                amount,
                time_entry_id,
                sort_order
            ) VALUES (
                p_invoice_id,
                v_item->>'description',
                (v_item->>'quantity')::NUMERIC,
                (v_item->>'unit_price')::NUMERIC,
                (v_item->>'quantity')::NUMERIC * (v_item->>'unit_price')::NUMERIC,
                (v_item->>'time_entry_id')::UUID,
                v_index
            );

            IF v_item->>'time_entry_id' IS NOT NULL THEN
                v_time_entry_ids := array_append(v_time_entry_ids, (v_item->>'time_entry_id')::UUID);
            END IF;

            v_index := v_index + 1;
        END LOOP;

        -- Mark new time entries as invoiced
        IF array_length(v_time_entry_ids, 1) > 0 THEN
            UPDATE time_entries
            SET invoice_id = p_invoice_id, updated_at = NOW()
            WHERE id = ANY(v_time_entry_ids);
        END IF;
    END IF;

    -- Return updated invoice with details
    SELECT get_invoice_with_details(p_user_id, p_invoice_id) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete invoice atomically

CREATE OR REPLACE FUNCTION delete_invoice(
    p_user_id UUID,
    p_invoice_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
BEGIN
    -- Get invoice status
    SELECT status INTO v_status
    FROM invoices
    WHERE id = p_invoice_id AND user_id = p_user_id;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Invoice not found';
    END IF;

    IF v_status != 'draft' THEN
        RAISE EXCEPTION 'VALIDATION: Only draft invoices can be deleted';
    END IF;

    -- Unmark time entries
    UPDATE time_entries
    SET invoice_id = NULL, updated_at = NOW()
    WHERE invoice_id = p_invoice_id;

    -- Delete line items (cascade should handle this, but explicit is safer)
    DELETE FROM invoice_line_items WHERE invoice_id = p_invoice_id;

    -- Delete invoice
    DELETE FROM invoices WHERE id = p_invoice_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to update invoice status (mark paid, void, send)

CREATE OR REPLACE FUNCTION update_invoice_status(
    p_user_id UUID,
    p_invoice_id UUID,
    p_action TEXT  -- 'send', 'paid', 'void'
)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_result JSON;
BEGIN
    -- Get current invoice
    SELECT * INTO v_invoice
    FROM invoices
    WHERE id = p_invoice_id AND user_id = p_user_id;

    IF v_invoice.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Invoice not found';
    END IF;

    IF p_action = 'send' THEN
        -- Update to sent
        UPDATE invoices
        SET status = 'sent', sent_at = NOW(), updated_at = NOW()
        WHERE id = p_invoice_id
        RETURNING * INTO v_invoice;

    ELSIF p_action = 'paid' THEN
        IF v_invoice.status NOT IN ('sent', 'overdue') THEN
            RAISE EXCEPTION 'VALIDATION: Can only mark sent or overdue invoices as paid';
        END IF;

        UPDATE invoices
        SET status = 'paid', paid_date = NOW(), updated_at = NOW()
        WHERE id = p_invoice_id
        RETURNING * INTO v_invoice;

    ELSIF p_action = 'void' THEN
        IF v_invoice.status = 'void' THEN
            RAISE EXCEPTION 'VALIDATION: Invoice is already void';
        END IF;

        -- Unmark time entries
        UPDATE time_entries
        SET invoice_id = NULL, updated_at = NOW()
        WHERE invoice_id = p_invoice_id;

        UPDATE invoices
        SET status = 'void', updated_at = NOW()
        WHERE id = p_invoice_id
        RETURNING * INTO v_invoice;

    ELSIF p_action = 'reminder' THEN
        IF v_invoice.status NOT IN ('sent', 'overdue') THEN
            RAISE EXCEPTION 'VALIDATION: Can only send reminders for sent or overdue invoices';
        END IF;

        UPDATE invoices
        SET reminder_sent_at = NOW(), updated_at = NOW()
        WHERE id = p_invoice_id
        RETURNING * INTO v_invoice;

    ELSE
        RAISE EXCEPTION 'VALIDATION: Invalid action';
    END IF;

    SELECT row_to_json(v_invoice) INTO v_result;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get public invoice (no auth required)

CREATE OR REPLACE FUNCTION get_public_invoice(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_user RECORD;
    v_result JSON;
BEGIN
    -- Get invoice with client
    SELECT
        i.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email) as client_json
    INTO v_invoice
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.public_token = p_token;

    IF v_invoice.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Invoice not found';
    END IF;

    -- Get user info
    SELECT full_name, company_name, email INTO v_user
    FROM users
    WHERE id = v_invoice.user_id;

    -- Build result
    SELECT json_build_object(
        'invoice', json_build_object(
            'id', v_invoice.id,
            'user_id', v_invoice.user_id,
            'client_id', v_invoice.client_id,
            'invoice_number', v_invoice.invoice_number,
            'status', v_invoice.status,
            'issue_date', v_invoice.issue_date,
            'due_date', v_invoice.due_date,
            'paid_date', v_invoice.paid_date,
            'sent_at', v_invoice.sent_at,
            'subtotal', v_invoice.subtotal,
            'tax_rate', v_invoice.tax_rate,
            'tax_amount', v_invoice.tax_amount,
            'discount_amount', v_invoice.discount_amount,
            'total', v_invoice.total,
            'currency', v_invoice.currency,
            'notes', v_invoice.notes,
            'terms', v_invoice.terms,
            'public_token', v_invoice.public_token,
            'created_at', v_invoice.created_at,
            'updated_at', v_invoice.updated_at,
            'client', v_invoice.client_json,
            'line_items', COALESCE((
                SELECT json_agg(li ORDER BY li.sort_order)
                FROM invoice_line_items li
                WHERE li.invoice_id = v_invoice.id
            ), '[]'::json)
        ),
        'user', json_build_object(
            'full_name', v_user.full_name,
            'company_name', v_user.company_name,
            'email', v_user.email
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get invoice data for sending email

CREATE OR REPLACE FUNCTION get_invoice_for_email(
    p_user_id UUID,
    p_invoice_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'invoice', json_build_object(
            'id', i.id,
            'invoice_number', i.invoice_number,
            'total', i.total,
            'due_date', i.due_date,
            'status', i.status,
            'public_token', i.public_token
        ),
        'client', json_build_object(
            'name', c.name,
            'email', c.email
        ),
        'user', json_build_object(
            'full_name', u.full_name,
            'company_name', u.company_name,
            'email', u.email
        )
    ) INTO v_result
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    LEFT JOIN users u ON u.id = i.user_id
    WHERE i.id = p_invoice_id AND i.user_id = p_user_id;

    IF v_result IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: Invoice not found';
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION list_invoices(UUID, INTEGER, INTEGER, UUID, TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION list_invoices(UUID, INTEGER, INTEGER, UUID, TEXT, DATE, DATE) TO service_role;

GRANT EXECUTE ON FUNCTION get_invoice_with_details(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_with_details(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION create_invoice(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, NUMERIC, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION create_invoice(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, NUMERIC, NUMERIC, JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION update_invoice(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, NUMERIC, NUMERIC, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION update_invoice(UUID, UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT, NUMERIC, NUMERIC, JSONB) TO service_role;

GRANT EXECUTE ON FUNCTION delete_invoice(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_invoice(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION update_invoice_status(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_invoice_status(UUID, UUID, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION get_public_invoice(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_invoice(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_invoice(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION get_invoice_for_email(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_invoice_for_email(UUID, UUID) TO service_role;
