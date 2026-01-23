-- Function to list clients with stats calculated inline
-- Eliminates N+1 query problem by calculating all stats in a single query

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
    v_result JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get total count
    SELECT COUNT(*) INTO v_total
    FROM clients c
    WHERE c.user_id = p_user_id
        AND (p_include_archived = TRUE OR c.is_archived = FALSE)
        AND (p_search IS NULL OR c.name ILIKE '%' || p_search || '%');

    -- Get paginated clients with stats
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
                    c.is_archived,
                    c.created_at,
                    c.updated_at,
                    -- Project count
                    COALESCE(project_stats.project_count, 0) as project_count,
                    -- Total invoiced by currency
                    COALESCE(invoice_stats.total_invoiced, '[]'::json) as total_invoiced,
                    -- Outstanding amount by currency
                    COALESCE(invoice_stats.outstanding_amount, '[]'::json) as outstanding_amount,
                    -- Unbilled amount by currency
                    COALESCE(unbilled_stats.unbilled_amount, '[]'::json) as unbilled_amount
                FROM clients c
                -- Project count subquery
                LEFT JOIN LATERAL (
                    SELECT COUNT(*)::INTEGER as project_count
                    FROM projects p
                    WHERE p.client_id = c.id AND p.is_archived = FALSE
                ) project_stats ON TRUE
                -- Invoice stats subquery
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
                -- Unbilled time entries stats subquery
                LEFT JOIN LATERAL (
                    SELECT COALESCE((
                        SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                        FROM (
                            SELECT
                                p.currency,
                                SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)) as amount
                            FROM time_entries te
                            INNER JOIN projects p ON p.id = te.project_id
                            WHERE p.client_id = c.id
                                AND te.is_billable = TRUE
                                AND te.invoice_id IS NULL
                            GROUP BY p.currency
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


-- Function to get a single client with stats

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
            SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
            FROM (
                SELECT
                    p.currency,
                    SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)) as amount
                FROM time_entries te
                INNER JOIN projects p ON p.id = te.project_id
                WHERE p.client_id = c.id
                    AND te.is_billable = TRUE
                    AND te.invoice_id IS NULL
                GROUP BY p.currency
                HAVING SUM((te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)) > 0
            ) unbilled_totals
        ), '[]'::json) as unbilled_amount
    ) unbilled_stats ON TRUE
    WHERE c.id = p_client_id
        AND c.user_id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete or archive a client

CREATE OR REPLACE FUNCTION delete_client(
    p_user_id UUID,
    p_client_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_project_count INTEGER;
    v_invoice_count INTEGER;
    v_result JSON;
BEGIN
    -- Check if client has any projects
    SELECT COUNT(*) INTO v_project_count
    FROM projects
    WHERE client_id = p_client_id;

    -- Check if client has any invoices
    SELECT COUNT(*) INTO v_invoice_count
    FROM invoices
    WHERE client_id = p_client_id;

    IF v_project_count > 0 OR v_invoice_count > 0 THEN
        -- Archive instead of delete
        UPDATE clients
        SET is_archived = TRUE, updated_at = NOW()
        WHERE id = p_client_id AND user_id = p_user_id
        RETURNING json_build_object('archived', TRUE, 'deleted', FALSE) INTO v_result;
    ELSE
        -- Actually delete
        DELETE FROM clients
        WHERE id = p_client_id AND user_id = p_user_id;

        v_result := json_build_object('archived', FALSE, 'deleted', TRUE);
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION list_clients(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_clients(UUID, INTEGER, INTEGER, BOOLEAN, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION get_client_with_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_with_stats(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION delete_client(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_client(UUID, UUID) TO service_role;
