-- Migration: Move currency from projects to clients
-- This removes currency from projects entirely and adds it to clients

-- Step 1: Add currency column to clients with default USD
ALTER TABLE clients ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- Step 2: Migrate existing data - use most common currency from client's projects
WITH client_currency_stats AS (
    SELECT
        p.client_id,
        p.currency,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY p.client_id ORDER BY COUNT(*) DESC, p.currency ASC) as rn
    FROM projects p
    WHERE p.client_id IS NOT NULL
    GROUP BY p.client_id, p.currency
)
UPDATE clients c
SET currency = COALESCE(
    (SELECT ccs.currency FROM client_currency_stats ccs WHERE ccs.client_id = c.id AND ccs.rn = 1),
    (SELECT us.default_currency FROM user_settings us WHERE us.user_id = c.user_id),
    'USD'
);

-- Step 3: Drop currency column from projects
ALTER TABLE projects DROP COLUMN IF EXISTS currency;


-- ============================================================
-- Step 4: Update list_clients to include currency
-- ============================================================
CREATE OR REPLACE FUNCTION list_clients(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_include_archived BOOLEAN DEFAULT FALSE,
    p_search TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_default_currency TEXT;
    v_result JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get user's default currency
    SELECT default_currency INTO v_default_currency
    FROM user_settings
    WHERE user_id = p_user_id;
    v_default_currency := COALESCE(v_default_currency, 'USD');

    SELECT COUNT(*) INTO v_total
    FROM clients c
    WHERE c.user_id = p_user_id
        AND (p_include_archived = TRUE OR c.is_archived = FALSE)
        AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%');

    SELECT json_build_object(
        'data', COALESCE((
            SELECT json_agg(client_row ORDER BY name ASC)
            FROM (
                SELECT
                    c.id,
                    c.user_id,
                    c.name,
                    c.contact_name,
                    c.email,
                    c.phone,
                    c.address,
                    c.notes,
                    c.currency,
                    c.is_archived,
                    c.created_at,
                    c.updated_at,
                    COALESCE(project_stats.project_count, 0) as project_count,
                    COALESCE(invoice_stats.total_invoiced, '[]'::json) as total_invoiced,
                    COALESCE(invoice_stats.outstanding_amount, '[]'::json) as outstanding_amount,
                    COALESCE(unbilled_stats.unbilled_amount, '[]'::json) as unbilled_amount
                FROM clients c
                LEFT JOIN LATERAL (
                    SELECT COUNT(*)::INTEGER as project_count
                    FROM projects p
                    WHERE p.client_id = c.id AND p.is_archived = FALSE
                ) project_stats ON TRUE
                LEFT JOIN LATERAL (
                    SELECT
                        COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(total::NUMERIC, 2)))
                            FROM (
                                SELECT currency, SUM(total) as total
                                FROM invoices i
                                WHERE i.client_id = c.id AND i.status != 'void'
                                GROUP BY currency
                                HAVING SUM(total) > 0
                            ) inv_totals
                        ), '[]'::json) as total_invoiced,
                        COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(total::NUMERIC, 2)))
                            FROM (
                                SELECT currency, SUM(total) as total
                                FROM invoices i
                                WHERE i.client_id = c.id AND i.status IN ('sent', 'overdue')
                                GROUP BY currency
                                HAVING SUM(total) > 0
                            ) outstanding_totals
                        ), '[]'::json) as outstanding_amount
                ) invoice_stats ON TRUE
                LEFT JOIN LATERAL (
                    SELECT COALESCE((
                        SELECT json_agg(json_build_object('currency', c.currency, 'amount', ROUND(amount::NUMERIC, 2)))
                        FROM (
                            SELECT
                                SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)) as amount
                            FROM time_entries te
                            INNER JOIN projects p ON p.id = te.project_id
                            WHERE p.client_id = c.id
                                AND te.is_billable = TRUE
                                AND te.invoice_id IS NULL
                            HAVING SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)) > 0
                        ) unbilled_totals
                    ), '[]'::json) as unbilled_amount
                ) unbilled_stats ON TRUE
                WHERE c.user_id = p_user_id
                    AND (p_include_archived = TRUE OR c.is_archived = FALSE)
                    AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%')
                ORDER BY c.name ASC
                LIMIT p_limit
                OFFSET v_offset
            ) client_row
        ), '[]'::json),
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


-- ============================================================
-- Step 5: Update get_client_with_stats to include currency
-- ============================================================
CREATE OR REPLACE FUNCTION get_client_with_stats(
    p_user_id UUID,
    p_client_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'id', c.id,
        'user_id', c.user_id,
        'name', c.name,
        'contact_name', c.contact_name,
        'email', c.email,
        'phone', c.phone,
        'address', c.address,
        'notes', c.notes,
        'currency', c.currency,
        'is_archived', c.is_archived,
        'created_at', c.created_at,
        'updated_at', c.updated_at,
        'project_count', COALESCE(project_stats.project_count, 0),
        'total_invoiced', COALESCE(invoice_stats.total_invoiced, '[]'::json),
        'outstanding_amount', COALESCE(invoice_stats.outstanding_amount, '[]'::json),
        'unbilled_amount', COALESCE(unbilled_stats.unbilled_amount, '[]'::json)
    ) INTO v_result
    FROM clients c
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::INTEGER as project_count
        FROM projects p
        WHERE p.client_id = c.id AND p.is_archived = FALSE
    ) project_stats ON TRUE
    LEFT JOIN LATERAL (
        SELECT
            COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(total::NUMERIC, 2)))
                FROM (
                    SELECT currency, SUM(total) as total
                    FROM invoices i
                    WHERE i.client_id = c.id AND i.status != 'void'
                    GROUP BY currency
                    HAVING SUM(total) > 0
                ) inv_totals
            ), '[]'::json) as total_invoiced,
            COALESCE((
                SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(total::NUMERIC, 2)))
                FROM (
                    SELECT currency, SUM(total) as total
                    FROM invoices i
                    WHERE i.client_id = c.id AND i.status IN ('sent', 'overdue')
                    GROUP BY currency
                    HAVING SUM(total) > 0
                ) outstanding_totals
            ), '[]'::json) as outstanding_amount
    ) invoice_stats ON TRUE
    LEFT JOIN LATERAL (
        SELECT COALESCE((
            SELECT json_agg(json_build_object('currency', c.currency, 'amount', ROUND(amount::NUMERIC, 2)))
            FROM (
                SELECT
                    SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)) as amount
                FROM time_entries te
                INNER JOIN projects p ON p.id = te.project_id
                WHERE p.client_id = c.id
                    AND te.is_billable = TRUE
                    AND te.invoice_id IS NULL
                HAVING SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)) > 0
            ) unbilled_totals
        ), '[]'::json) as unbilled_amount
    ) unbilled_stats ON TRUE
    WHERE c.id = p_client_id
        AND c.user_id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Step 6: Update list_projects - remove currency, add client.currency
-- ============================================================
CREATE OR REPLACE FUNCTION list_projects(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_client_id UUID DEFAULT NULL,
    p_include_archived BOOLEAN DEFAULT FALSE,
    p_search TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_default_rate NUMERIC;
    v_default_currency TEXT;
    v_result JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    SELECT default_hourly_rate, default_currency INTO v_default_rate, v_default_currency
    FROM user_settings
    WHERE user_id = p_user_id;
    v_default_currency := COALESCE(v_default_currency, 'USD');

    SELECT COUNT(*) INTO v_total
    FROM projects p
    WHERE p.user_id = p_user_id
        AND (p_client_id IS NULL OR p.client_id = p_client_id)
        AND (p_include_archived = TRUE OR p.is_archived = FALSE)
        AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%');

    SELECT json_build_object(
        'data', COALESCE((
            SELECT json_agg(project_row ORDER BY name ASC)
            FROM (
                SELECT
                    p.id,
                    p.user_id,
                    p.client_id,
                    p.name,
                    p.color,
                    p.hourly_rate,
                    p.is_billable,
                    p.is_default,
                    p.is_archived,
                    p.notes,
                    p.created_at,
                    p.updated_at,
                    CASE
                        WHEN c.id IS NOT NULL THEN json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'currency', c.currency
                        )
                        ELSE NULL
                    END as client,
                    -- Effective currency: client's currency or user default
                    COALESCE(c.currency, v_default_currency) as currency,
                    COALESCE(ROUND(stats.total_seconds::NUMERIC / 3600, 2), 0) as total_hours,
                    COALESCE(ROUND(stats.total_amount::NUMERIC, 2), 0) as total_amount,
                    COALESCE(ROUND(stats.unbilled_seconds::NUMERIC / 3600, 2), 0) as unbilled_hours,
                    COALESCE(ROUND(stats.unbilled_amount::NUMERIC, 2), 0) as unbilled_amount
                FROM projects p
                LEFT JOIN clients c ON c.id = p.client_id
                LEFT JOIN LATERAL (
                    SELECT
                        SUM(te.duration_seconds) as total_seconds,
                        SUM(
                            CASE WHEN te.is_billable THEN
                                (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, v_default_rate, 0)
                            ELSE 0 END
                        ) as total_amount,
                        SUM(
                            CASE WHEN te.invoice_id IS NULL AND te.is_billable THEN te.duration_seconds ELSE 0 END
                        ) as unbilled_seconds,
                        SUM(
                            CASE WHEN te.invoice_id IS NULL AND te.is_billable THEN
                                (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, v_default_rate, 0)
                            ELSE 0 END
                        ) as unbilled_amount
                    FROM time_entries te
                    WHERE te.project_id = p.id
                ) stats ON TRUE
                WHERE p.user_id = p_user_id
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
                    AND (p_include_archived = TRUE OR p.is_archived = FALSE)
                    AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%')
                ORDER BY p.name ASC
                LIMIT p_limit
                OFFSET v_offset
            ) project_row
        ), '[]'::json),
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


-- ============================================================
-- Step 7: Update get_project_with_stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_project_with_stats(
    p_user_id UUID,
    p_project_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_default_rate NUMERIC;
    v_default_currency TEXT;
    v_result JSON;
BEGIN
    SELECT default_hourly_rate, default_currency INTO v_default_rate, v_default_currency
    FROM user_settings
    WHERE user_id = p_user_id;
    v_default_currency := COALESCE(v_default_currency, 'USD');

    SELECT json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'client_id', p.client_id,
        'name', p.name,
        'color', p.color,
        'hourly_rate', p.hourly_rate,
        'is_billable', p.is_billable,
        'is_default', p.is_default,
        'is_archived', p.is_archived,
        'notes', p.notes,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'client', CASE
            WHEN c.id IS NOT NULL THEN json_build_object(
                'id', c.id,
                'name', c.name,
                'currency', c.currency
            )
            ELSE NULL
        END,
        'currency', COALESCE(c.currency, v_default_currency),
        'total_hours', COALESCE(ROUND(stats.total_seconds::NUMERIC / 3600, 2), 0),
        'total_amount', COALESCE(ROUND(stats.total_amount::NUMERIC, 2), 0),
        'unbilled_hours', COALESCE(ROUND(stats.unbilled_seconds::NUMERIC / 3600, 2), 0),
        'unbilled_amount', COALESCE(ROUND(stats.unbilled_amount::NUMERIC, 2), 0)
    ) INTO v_result
    FROM projects p
    LEFT JOIN clients c ON c.id = p.client_id
    LEFT JOIN LATERAL (
        SELECT
            SUM(te.duration_seconds) as total_seconds,
            SUM(
                CASE WHEN te.is_billable THEN
                    (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, v_default_rate, 0)
                ELSE 0 END
            ) as total_amount,
            SUM(
                CASE WHEN te.invoice_id IS NULL AND te.is_billable THEN te.duration_seconds ELSE 0 END
            ) as unbilled_seconds,
            SUM(
                CASE WHEN te.invoice_id IS NULL AND te.is_billable THEN
                    (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, v_default_rate, 0)
                ELSE 0 END
            ) as unbilled_amount
        FROM time_entries te
        WHERE te.project_id = p.id
    ) stats ON TRUE
    WHERE p.id = p_project_id
        AND p.user_id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Step 8: Update create_project - remove p_currency parameter
-- ============================================================
DROP FUNCTION IF EXISTS create_project(UUID, TEXT, UUID, TEXT, NUMERIC, TEXT, BOOLEAN, BOOLEAN, TEXT);

CREATE OR REPLACE FUNCTION create_project(
    p_user_id UUID,
    p_name TEXT,
    p_client_id UUID DEFAULT NULL,
    p_color TEXT DEFAULT '#6366f1',
    p_hourly_rate NUMERIC DEFAULT NULL,
    p_is_billable BOOLEAN DEFAULT TRUE,
    p_is_default BOOLEAN DEFAULT FALSE,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_project_id UUID;
    v_result JSON;
BEGIN
    IF p_is_default THEN
        UPDATE projects
        SET is_default = FALSE, updated_at = NOW()
        WHERE user_id = p_user_id AND is_default = TRUE;
    END IF;

    INSERT INTO projects (
        user_id,
        client_id,
        name,
        color,
        hourly_rate,
        is_billable,
        is_default,
        notes
    ) VALUES (
        p_user_id,
        p_client_id,
        p_name,
        p_color,
        p_hourly_rate,
        p_is_billable,
        p_is_default,
        p_notes
    )
    RETURNING id INTO v_project_id;

    SELECT row_to_json(p.*) INTO v_result
    FROM projects p
    WHERE p.id = v_project_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for new signature
GRANT EXECUTE ON FUNCTION create_project(UUID, TEXT, UUID, TEXT, NUMERIC, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_project(UUID, TEXT, UUID, TEXT, NUMERIC, BOOLEAN, BOOLEAN, TEXT) TO service_role;


-- ============================================================
-- Step 9: Update create_invoice to use client's currency
-- ============================================================
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
    v_currency TEXT;
    v_public_token TEXT;
    v_invoice_id UUID;
    v_item JSONB;
    v_index INTEGER := 0;
    v_time_entry_ids UUID[];
    v_result JSON;
BEGIN
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

    SELECT COALESCE(SUM((item->>'quantity')::NUMERIC * (item->>'unit_price')::NUMERIC), 0)
    INTO v_subtotal
    FROM jsonb_array_elements(p_line_items) AS item;

    v_tax_amount := ROUND(v_subtotal * (p_tax_rate / 100), 2);
    v_total := v_subtotal + v_tax_amount - COALESCE(p_discount_amount, 0);

    -- Get currency from client
    SELECT c.currency INTO v_currency
    FROM clients c
    WHERE c.id = p_client_id;

    IF v_currency IS NULL THEN
        SELECT default_currency INTO v_currency
        FROM user_settings
        WHERE user_id = p_user_id;
    END IF;
    v_currency := COALESCE(v_currency, 'USD');

    v_public_token := encode(gen_random_bytes(24), 'base64');
    v_public_token := replace(replace(replace(v_public_token, '+', ''), '/', ''), '=', '');

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

        IF v_item->>'time_entry_id' IS NOT NULL THEN
            v_time_entry_ids := array_append(v_time_entry_ids, (v_item->>'time_entry_id')::UUID);
        END IF;

        v_index := v_index + 1;
    END LOOP;

    IF array_length(v_time_entry_ids, 1) > 0 THEN
        UPDATE time_entries
        SET invoice_id = v_invoice_id, updated_at = NOW()
        WHERE id = ANY(v_time_entry_ids);
    END IF;

    SELECT get_invoice_with_details(p_user_id, v_invoice_id) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Step 10: Update list_time_entries - get currency from client
-- ============================================================
CREATE OR REPLACE FUNCTION list_time_entries(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_project_id UUID DEFAULT NULL,
    p_client_id UUID DEFAULT NULL,
    p_is_billable BOOLEAN DEFAULT NULL,
    p_is_invoiced BOOLEAN DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_search TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_default_currency TEXT;
    v_result JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    SELECT default_currency INTO v_default_currency
    FROM user_settings
    WHERE user_id = p_user_id;
    v_default_currency := COALESCE(v_default_currency, 'USD');

    SELECT COUNT(*) INTO v_total
    FROM time_entries te
    LEFT JOIN projects p ON p.id = te.project_id
    WHERE te.user_id = p_user_id
        AND (p_project_id IS NULL OR te.project_id = p_project_id)
        AND (p_client_id IS NULL OR p.client_id = p_client_id)
        AND (p_is_billable IS NULL OR te.is_billable = p_is_billable)
        AND (p_is_invoiced IS NULL OR
            (p_is_invoiced = TRUE AND te.invoice_id IS NOT NULL) OR
            (p_is_invoiced = FALSE AND te.invoice_id IS NULL))
        AND (p_start_date IS NULL OR te.start_time >= p_start_date)
        AND (p_end_date IS NULL OR te.start_time <= p_end_date)
        AND (p_search IS NULL OR te.description ILIKE '%' || p_search || '%');

    SELECT json_build_object(
        'data', COALESCE((
            SELECT json_agg(entry_row ORDER BY start_time DESC)
            FROM (
                SELECT
                    te.id,
                    te.user_id,
                    te.project_id,
                    te.description,
                    te.start_time,
                    te.end_time,
                    te.duration_seconds,
                    te.hourly_rate,
                    te.is_billable,
                    te.invoice_id IS NOT NULL as is_invoiced,
                    te.invoice_id,
                    te.created_at,
                    te.updated_at,
                    CASE
                        WHEN p.id IS NOT NULL THEN json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'color', p.color,
                            'hourly_rate', p.hourly_rate
                        )
                        ELSE NULL
                    END as project,
                    CASE
                        WHEN c.id IS NOT NULL THEN json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'currency', c.currency
                        )
                        ELSE NULL
                    END as client,
                    CASE
                        WHEN te.is_billable THEN
                            ROUND((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0), 2)
                        ELSE 0
                    END as amount
                FROM time_entries te
                LEFT JOIN projects p ON p.id = te.project_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE te.user_id = p_user_id
                    AND (p_project_id IS NULL OR te.project_id = p_project_id)
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
                    AND (p_is_billable IS NULL OR te.is_billable = p_is_billable)
                    AND (p_is_invoiced IS NULL OR
                        (p_is_invoiced = TRUE AND te.invoice_id IS NOT NULL) OR
                        (p_is_invoiced = FALSE AND te.invoice_id IS NULL))
                    AND (p_start_date IS NULL OR te.start_time >= p_start_date)
                    AND (p_end_date IS NULL OR te.start_time <= p_end_date)
                    AND (p_search IS NULL OR te.description ILIKE '%' || p_search || '%')
                ORDER BY te.start_time DESC
                LIMIT p_limit
                OFFSET v_offset
            ) entry_row
        ), '[]'::json),
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


-- ============================================================
-- Step 11: Update get_unbilled_time_entries
-- ============================================================
CREATE OR REPLACE FUNCTION get_unbilled_time_entries(
    p_user_id UUID,
    p_client_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_default_currency TEXT;
    v_result JSON;
BEGIN
    SELECT default_currency INTO v_default_currency
    FROM user_settings
    WHERE user_id = p_user_id;
    v_default_currency := COALESCE(v_default_currency, 'USD');

    SELECT json_build_object(
        'entries', COALESCE((
            SELECT json_agg(entry_row ORDER BY start_time DESC)
            FROM (
                SELECT
                    te.id,
                    te.user_id,
                    te.project_id,
                    te.description,
                    te.start_time,
                    te.end_time,
                    te.duration_seconds,
                    te.hourly_rate,
                    te.is_billable,
                    te.invoice_id IS NOT NULL as is_invoiced,
                    te.invoice_id,
                    te.created_at,
                    te.updated_at,
                    CASE
                        WHEN p.id IS NOT NULL THEN json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'color', p.color,
                            'hourly_rate', p.hourly_rate
                        )
                        ELSE NULL
                    END as project,
                    CASE
                        WHEN c.id IS NOT NULL THEN json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'currency', c.currency
                        )
                        ELSE NULL
                    END as client,
                    ROUND((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0), 2) as amount
                FROM time_entries te
                LEFT JOIN projects p ON p.id = te.project_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE te.user_id = p_user_id
                    AND te.is_billable = TRUE
                    AND te.invoice_id IS NULL
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
                ORDER BY te.start_time DESC
            ) entry_row
        ), '[]'::json),
        'total_hours', COALESCE((
            SELECT ROUND(SUM(te.duration_seconds)::NUMERIC / 3600, 2)
            FROM time_entries te
            LEFT JOIN projects p ON p.id = te.project_id
            WHERE te.user_id = p_user_id
                AND te.is_billable = TRUE
                AND te.invoice_id IS NULL
                AND (p_client_id IS NULL OR p.client_id = p_client_id)
        ), 0),
        'total_amount', COALESCE((
            SELECT ROUND(SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)), 2)
            FROM time_entries te
            LEFT JOIN projects p ON p.id = te.project_id
            WHERE te.user_id = p_user_id
                AND te.is_billable = TRUE
                AND te.invoice_id IS NULL
                AND (p_client_id IS NULL OR p.client_id = p_client_id)
        ), 0)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- Step 12: Update get_dashboard_data - get currency from client
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_data(
    p_user_id UUID,
    p_recent_entries_limit INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
    v_today_start TIMESTAMPTZ;
    v_today_end TIMESTAMPTZ;
    v_week_start TIMESTAMPTZ;
    v_week_end TIMESTAMPTZ;
    v_month_start TIMESTAMPTZ;
    v_month_end TIMESTAMPTZ;
    v_default_currency TEXT;
    v_result JSON;
BEGIN
    v_today_start := date_trunc('day', NOW());
    v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 millisecond';
    v_week_start := date_trunc('week', NOW()) - INTERVAL '1 day';
    v_week_end := v_week_start + INTERVAL '7 days' - INTERVAL '1 millisecond';
    v_month_start := date_trunc('month', NOW());
    v_month_end := (date_trunc('month', NOW()) + INTERVAL '1 month') - INTERVAL '1 millisecond';

    SELECT default_currency INTO v_default_currency
    FROM user_settings
    WHERE user_id = p_user_id;
    v_default_currency := COALESCE(v_default_currency, 'USD');

    SELECT json_build_object(
        'stats', (
            SELECT json_build_object(
                'today', (
                    SELECT json_build_object(
                        'hours', COALESCE(ROUND((SUM(te.duration_seconds)::NUMERIC / 3600), 2), 0),
                        'amounts', COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                            FROM (
                                SELECT
                                    COALESCE(c.currency, v_default_currency) as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                LEFT JOIN clients c ON c.id = p.client_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.start_time >= v_today_start
                                    AND te2.start_time <= v_today_end
                                    AND te2.is_billable = TRUE
                                GROUP BY COALESCE(c.currency, v_default_currency)
                                HAVING SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) > 0
                            ) amounts
                        ), '[]'::json),
                        'entries_count', COUNT(*)::INTEGER
                    )
                    FROM time_entries te
                    WHERE te.user_id = p_user_id
                        AND te.start_time >= v_today_start
                        AND te.start_time <= v_today_end
                ),
                'this_week', (
                    SELECT json_build_object(
                        'hours', COALESCE(ROUND((SUM(te.duration_seconds)::NUMERIC / 3600), 2), 0),
                        'amounts', COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                            FROM (
                                SELECT
                                    COALESCE(c.currency, v_default_currency) as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                LEFT JOIN clients c ON c.id = p.client_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.start_time >= v_week_start
                                    AND te2.start_time <= v_week_end
                                    AND te2.is_billable = TRUE
                                GROUP BY COALESCE(c.currency, v_default_currency)
                                HAVING SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) > 0
                            ) amounts
                        ), '[]'::json),
                        'entries_count', COUNT(*)::INTEGER
                    )
                    FROM time_entries te
                    WHERE te.user_id = p_user_id
                        AND te.start_time >= v_week_start
                        AND te.start_time <= v_week_end
                ),
                'this_month', (
                    SELECT json_build_object(
                        'hours', COALESCE(ROUND((SUM(te.duration_seconds)::NUMERIC / 3600), 2), 0),
                        'amounts', COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                            FROM (
                                SELECT
                                    COALESCE(c.currency, v_default_currency) as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                LEFT JOIN clients c ON c.id = p.client_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.start_time >= v_month_start
                                    AND te2.start_time <= v_month_end
                                    AND te2.is_billable = TRUE
                                GROUP BY COALESCE(c.currency, v_default_currency)
                                HAVING SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) > 0
                            ) amounts
                        ), '[]'::json),
                        'invoiced', COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                            FROM (
                                SELECT currency, SUM(total) as amount
                                FROM invoices
                                WHERE user_id = p_user_id
                                    AND issue_date >= v_month_start::DATE
                                    AND issue_date <= v_month_end::DATE
                                    AND status = 'paid'
                                GROUP BY currency
                                HAVING SUM(total) > 0
                            ) inv
                        ), '[]'::json),
                        'outstanding', COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                            FROM (
                                SELECT currency, SUM(total) as amount
                                FROM invoices
                                WHERE user_id = p_user_id
                                    AND issue_date >= v_month_start::DATE
                                    AND issue_date <= v_month_end::DATE
                                    AND status IN ('sent', 'overdue')
                                GROUP BY currency
                                HAVING SUM(total) > 0
                            ) inv
                        ), '[]'::json)
                    )
                    FROM time_entries te
                    WHERE te.user_id = p_user_id
                        AND te.start_time >= v_month_start
                        AND te.start_time <= v_month_end
                ),
                'unbilled', (
                    SELECT json_build_object(
                        'hours', COALESCE(ROUND((SUM(te.duration_seconds)::NUMERIC / 3600), 2), 0),
                        'amounts', COALESCE((
                            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                            FROM (
                                SELECT
                                    COALESCE(c.currency, v_default_currency) as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                LEFT JOIN clients c ON c.id = p.client_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.is_billable = TRUE
                                    AND te2.invoice_id IS NULL
                                GROUP BY COALESCE(c.currency, v_default_currency)
                                HAVING SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) > 0
                            ) amounts
                        ), '[]'::json)
                    )
                    FROM time_entries te
                    WHERE te.user_id = p_user_id
                        AND te.is_billable = TRUE
                        AND te.invoice_id IS NULL
                ),
                'active_projects', (
                    SELECT COUNT(*)::INTEGER
                    FROM projects
                    WHERE user_id = p_user_id AND is_archived = FALSE
                ),
                'active_clients', (
                    SELECT COUNT(*)::INTEGER
                    FROM clients
                    WHERE user_id = p_user_id AND is_archived = FALSE
                )
            )
        ),
        'recent_entries', (
            SELECT COALESCE(json_agg(entry_data ORDER BY start_time DESC), '[]'::json)
            FROM (
                SELECT
                    te.id,
                    te.user_id,
                    te.project_id,
                    te.description,
                    te.start_time,
                    te.end_time,
                    te.duration_seconds,
                    te.hourly_rate,
                    te.is_billable,
                    te.invoice_id IS NOT NULL as is_invoiced,
                    te.invoice_id,
                    te.created_at,
                    te.updated_at,
                    CASE
                        WHEN p.id IS NOT NULL THEN json_build_object(
                            'id', p.id,
                            'name', p.name,
                            'color', p.color,
                            'hourly_rate', p.hourly_rate
                        )
                        ELSE NULL
                    END as project,
                    CASE
                        WHEN c.id IS NOT NULL THEN json_build_object(
                            'id', c.id,
                            'name', c.name,
                            'currency', c.currency
                        )
                        ELSE NULL
                    END as client,
                    CASE
                        WHEN te.is_billable THEN
                            ROUND((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0), 2)
                        ELSE 0
                    END as amount
                FROM time_entries te
                LEFT JOIN projects p ON p.id = te.project_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE te.user_id = p_user_id
                ORDER BY te.start_time DESC
                LIMIT p_recent_entries_limit
            ) entry_data
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
