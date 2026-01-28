-- Sort invoices by created_at descending instead of issue_date

CREATE OR REPLACE FUNCTION list_invoices(
    p_user_id UUID,
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20,
    p_client_id UUID DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
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

    -- Get total count of matching invoices
    IF p_project_id IS NOT NULL THEN
        -- When filtering by project, find invoices via: invoice_line_items -> time_entries -> project_id
        SELECT COUNT(DISTINCT i.id) INTO v_total
        FROM invoices i
        WHERE i.user_id = p_user_id
            AND (p_client_id IS NULL OR i.client_id = p_client_id)
            AND (p_status IS NULL OR i.status = p_status::invoice_status)
            AND (p_start_date IS NULL OR i.issue_date::DATE >= p_start_date)
            AND (p_end_date IS NULL OR i.issue_date::DATE <= p_end_date)
            AND EXISTS (
                SELECT 1
                FROM invoice_line_items ili
                INNER JOIN time_entries te ON te.id = ili.time_entry_id
                WHERE ili.invoice_id = i.id
                  AND te.project_id = p_project_id
            );
    ELSE
        -- No project filter, count all matching invoices
        SELECT COUNT(*) INTO v_total
        FROM invoices i
        WHERE i.user_id = p_user_id
            AND (p_client_id IS NULL OR i.client_id = p_client_id)
            AND (p_status IS NULL OR i.status = p_status::invoice_status)
            AND (p_start_date IS NULL OR i.issue_date::DATE >= p_start_date)
            AND (p_end_date IS NULL OR i.issue_date::DATE <= p_end_date);
    END IF;

    -- Get paginated data with client info
    IF p_project_id IS NOT NULL THEN
        -- When filtering by project, find invoices via: invoice_line_items -> time_entries -> project_id
        SELECT COALESCE(json_agg(invoice_data ORDER BY created_at DESC), '[]'::json)
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
                AND (p_status IS NULL OR i.status = p_status::invoice_status)
                AND (p_start_date IS NULL OR i.issue_date::DATE >= p_start_date)
                AND (p_end_date IS NULL OR i.issue_date::DATE <= p_end_date)
                AND EXISTS (
                    SELECT 1
                    FROM invoice_line_items ili
                    INNER JOIN time_entries te ON te.id = ili.time_entry_id
                    WHERE ili.invoice_id = i.id
                      AND te.project_id = p_project_id
                )
            ORDER BY i.created_at DESC
            LIMIT p_limit OFFSET v_offset
        ) invoice_data;
    ELSE
        -- No project filter
        SELECT COALESCE(json_agg(invoice_data ORDER BY created_at DESC), '[]'::json)
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
                AND (p_status IS NULL OR i.status = p_status::invoice_status)
                AND (p_start_date IS NULL OR i.issue_date::DATE >= p_start_date)
                AND (p_end_date IS NULL OR i.issue_date::DATE <= p_end_date)
            ORDER BY i.created_at DESC
            LIMIT p_limit OFFSET v_offset
        ) invoice_data;
    END IF;

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
