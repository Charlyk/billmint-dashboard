-- ============================================
-- AUTOMATIC OVERDUE INVOICE MARKING
-- ============================================
-- This migration adds two mechanisms to automatically mark invoices as overdue:
-- 1. A scheduled function (for pg_cron) that runs daily
-- 2. A trigger that checks on invoice updates
-- 3. Updates to invoice fetch functions to check overdue status on read

-- ============================================
-- 1. FUNCTION TO MARK OVERDUE INVOICES
-- ============================================

CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE status = 'sent'
      AND due_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service_role (used by cron jobs)
GRANT EXECUTE ON FUNCTION mark_overdue_invoices() TO service_role;

-- ============================================
-- 2. TRIGGER TO CHECK OVERDUE ON UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION check_invoice_overdue()
RETURNS TRIGGER AS $$
BEGIN
    -- If invoice is 'sent' and due_date has passed, mark as overdue
    IF NEW.status = 'sent' AND NEW.due_date < CURRENT_DATE THEN
        NEW.status := 'overdue';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_invoice_overdue_on_update
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION check_invoice_overdue();

-- Also check on insert (in case someone creates an invoice with past due date and sends it)
CREATE TRIGGER check_invoice_overdue_on_insert
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION check_invoice_overdue();

-- ============================================
-- 3. UPDATE GET_INVOICE TO CHECK OVERDUE
-- ============================================

CREATE OR REPLACE FUNCTION get_invoice(p_user_id UUID, p_invoice_id UUID)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_line_items JSON;
    v_result JSON;
BEGIN
    -- First, update the invoice to overdue if needed
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE id = p_invoice_id
      AND user_id = p_user_id
      AND status = 'sent'
      AND due_date < CURRENT_DATE;

    -- Get invoice with client
    SELECT
        i.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email) as client_json
    INTO v_invoice
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.id = p_invoice_id AND i.user_id = p_user_id;

    IF v_invoice.id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get line items
    SELECT json_agg(
        json_build_object(
            'id', id,
            'description', description,
            'quantity', quantity,
            'unit_price', unit_price,
            'amount', amount,
            'time_entry_id', time_entry_id
        ) ORDER BY created_at
    )
    INTO v_line_items
    FROM invoice_line_items
    WHERE invoice_id = p_invoice_id;

    -- Build result
    SELECT json_build_object(
        'id', v_invoice.id,
        'user_id', v_invoice.user_id,
        'client_id', v_invoice.client_id,
        'client', v_invoice.client_json,
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
        'line_items', COALESCE(v_line_items, '[]'::json),
        'created_at', v_invoice.created_at,
        'updated_at', v_invoice.updated_at
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. UPDATE LIST_INVOICES TO CHECK OVERDUE
-- ============================================

CREATE OR REPLACE FUNCTION list_invoices(
    p_user_id UUID,
    p_status TEXT DEFAULT NULL,
    p_client_id UUID DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    v_invoices JSON;
    v_total INTEGER;
BEGIN
    -- First, mark any overdue invoices for this user
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE user_id = p_user_id
      AND status = 'sent'
      AND due_date < CURRENT_DATE;

    -- Get total count
    SELECT COUNT(*) INTO v_total
    FROM invoices i
    WHERE i.user_id = p_user_id
      AND (p_status IS NULL OR i.status = p_status::invoice_status)
      AND (p_client_id IS NULL OR i.client_id = p_client_id)
      AND (p_project_id IS NULL OR EXISTS (
          SELECT 1 FROM invoice_line_items ili
          JOIN time_entries te ON te.id = ili.time_entry_id
          WHERE ili.invoice_id = i.id AND te.project_id = p_project_id
      ));

    -- Get invoices with client info
    SELECT json_agg(invoice_row ORDER BY created_at DESC)
    INTO v_invoices
    FROM (
        SELECT json_build_object(
            'id', i.id,
            'invoice_number', i.invoice_number,
            'status', i.status,
            'issue_date', i.issue_date,
            'due_date', i.due_date,
            'total', i.total,
            'currency', i.currency,
            'client', json_build_object('id', c.id, 'name', c.name),
            'created_at', i.created_at
        ) as invoice_row,
        i.created_at
        FROM invoices i
        LEFT JOIN clients c ON c.id = i.client_id
        WHERE i.user_id = p_user_id
          AND (p_status IS NULL OR i.status = p_status::invoice_status)
          AND (p_client_id IS NULL OR i.client_id = p_client_id)
          AND (p_project_id IS NULL OR EXISTS (
              SELECT 1 FROM invoice_line_items ili
              JOIN time_entries te ON te.id = ili.time_entry_id
              WHERE ili.invoice_id = i.id AND te.project_id = p_project_id
          ))
        ORDER BY i.created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    ) t;

    RETURN json_build_object(
        'invoices', COALESCE(v_invoices, '[]'::json),
        'total', v_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. UPDATE GET_PUBLIC_INVOICE TO CHECK OVERDUE
-- ============================================

CREATE OR REPLACE FUNCTION get_public_invoice(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_invoice RECORD;
    v_user RECORD;
    v_line_items JSON;
    v_result JSON;
BEGIN
    -- First, update the invoice to overdue if needed
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE public_token = p_token
      AND status = 'sent'
      AND due_date < CURRENT_DATE;

    -- Get invoice with client
    SELECT
        i.*,
        json_build_object('id', c.id, 'name', c.name, 'email', c.email) as client_json
    INTO v_invoice
    FROM invoices i
    LEFT JOIN clients c ON c.id = i.client_id
    WHERE i.public_token = p_token;

    IF v_invoice.id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get user info
    SELECT * INTO v_user
    FROM users
    WHERE id = v_invoice.user_id;

    -- Get line items
    SELECT json_agg(
        json_build_object(
            'id', id,
            'description', description,
            'quantity', quantity,
            'unit_price', unit_price,
            'amount', amount
        ) ORDER BY created_at
    )
    INTO v_line_items
    FROM invoice_line_items
    WHERE invoice_id = v_invoice.id;

    -- Build result
    SELECT json_build_object(
        'invoice', json_build_object(
            'id', v_invoice.id,
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
            'public_token', v_invoice.public_token
        ),
        'client', v_invoice.client_json,
        'user', json_build_object(
            'full_name', v_user.full_name,
            'company_name', v_user.company_name,
            'email', v_user.email,
            'phone', v_user.phone,
            'address', v_user.address,
            'logo_url', v_user.logo_url
        ),
        'line_items', COALESCE(v_line_items, '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. UPDATE GET_INVOICE_FOR_EMAIL TO CHECK OVERDUE
-- ============================================

CREATE OR REPLACE FUNCTION get_invoice_for_email(
    p_user_id UUID,
    p_invoice_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- First, update the invoice to overdue if needed
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE id = p_invoice_id
      AND user_id = p_user_id
      AND status = 'sent'
      AND due_date < CURRENT_DATE;

    SELECT json_build_object(
        'invoice', json_build_object(
            'id', i.id,
            'invoice_number', i.invoice_number,
            'total', i.total,
            'currency', i.currency,
            'issue_date', i.issue_date,
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

-- ============================================
-- 7. SETUP PG_CRON JOB (if extension is available)
-- ============================================
-- Note: pg_cron must be enabled in the Supabase dashboard under Database > Extensions
-- Run this manually in the SQL editor after enabling pg_cron:
--
-- SELECT cron.schedule(
--     'mark-overdue-invoices',           -- job name
--     '0 0 * * *',                        -- every day at midnight UTC
--     'SELECT mark_overdue_invoices()'   -- function to run
-- );
--
-- To verify the job was created:
-- SELECT * FROM cron.job;
--
-- To remove the job:
-- SELECT cron.unschedule('mark-overdue-invoices');
