-- Fix generate_time_report to handle multiple currencies properly
-- - Add currency to by_project results
-- - Change summary amounts to array grouped by currency

CREATE OR REPLACE FUNCTION generate_time_report(
    p_user_id UUID,
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_project_id UUID DEFAULT NULL,
    p_client_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_default_currency TEXT;
BEGIN
    -- Get user's default currency for entries without a client
    SELECT COALESCE(default_currency, 'USD') INTO v_default_currency
    FROM user_settings
    WHERE user_id = p_user_id;

    IF v_default_currency IS NULL THEN
        v_default_currency := 'USD';
    END IF;

    SELECT json_build_object(
        'period', json_build_object(
            'start', p_start_date,
            'end', p_end_date
        ),
        'summary', (
            SELECT json_build_object(
                'total_hours', COALESCE(ROUND(SUM(te.duration_seconds)::NUMERIC / 3600, 2), 0),
                'total_amounts', COALESCE((
                    SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                    FROM (
                        SELECT
                            COALESCE(c.currency, v_default_currency) as currency,
                            SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p2.hourly_rate, 0)) as amount
                        FROM time_entries te2
                        LEFT JOIN projects p2 ON p2.id = te2.project_id
                        LEFT JOIN clients c ON c.id = p2.client_id
                        WHERE te2.user_id = p_user_id
                            AND te2.start_time >= p_start_date
                            AND te2.start_time <= p_end_date
                            AND (p_project_id IS NULL OR te2.project_id = p_project_id)
                            AND (p_client_id IS NULL OR p2.client_id = p_client_id)
                        GROUP BY COALESCE(c.currency, v_default_currency)
                    ) amounts
                ), '[]'::json),
                'billable_hours', COALESCE(ROUND(SUM(
                    CASE WHEN te.is_billable THEN te.duration_seconds ELSE 0 END
                )::NUMERIC / 3600, 2), 0),
                'billable_amounts', COALESCE((
                    SELECT json_agg(json_build_object('currency', currency, 'amount', ROUND(amount::NUMERIC, 2)))
                    FROM (
                        SELECT
                            COALESCE(c.currency, v_default_currency) as currency,
                            SUM(CASE WHEN te2.is_billable THEN
                                (te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p2.hourly_rate, 0)
                            ELSE 0 END) as amount
                        FROM time_entries te2
                        LEFT JOIN projects p2 ON p2.id = te2.project_id
                        LEFT JOIN clients c ON c.id = p2.client_id
                        WHERE te2.user_id = p_user_id
                            AND te2.start_time >= p_start_date
                            AND te2.start_time <= p_end_date
                            AND (p_project_id IS NULL OR te2.project_id = p_project_id)
                            AND (p_client_id IS NULL OR p2.client_id = p_client_id)
                        GROUP BY COALESCE(c.currency, v_default_currency)
                    ) amounts
                ), '[]'::json),
                'non_billable_hours', COALESCE(ROUND(SUM(
                    CASE WHEN NOT te.is_billable THEN te.duration_seconds ELSE 0 END
                )::NUMERIC / 3600, 2), 0)
            )
            FROM time_entries te
            LEFT JOIN projects p ON p.id = te.project_id
            WHERE te.user_id = p_user_id
                AND te.start_time >= p_start_date
                AND te.start_time <= p_end_date
                AND (p_project_id IS NULL OR te.project_id = p_project_id)
                AND (p_client_id IS NULL OR p.client_id = p_client_id)
        ),
        'by_project', COALESCE((
            SELECT json_agg(project_data ORDER BY project_name)
            FROM (
                SELECT
                    json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'color', p.color
                    ) as project,
                    c.name as client_name,
                    COALESCE(c.currency, v_default_currency) as currency,
                    p.name as project_name,
                    ROUND(SUM(te.duration_seconds)::NUMERIC / 3600, 2) as hours,
                    ROUND(SUM(
                        CASE WHEN te.is_billable THEN
                            (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)
                        ELSE 0 END
                    ), 2) as amount
                FROM time_entries te
                INNER JOIN projects p ON p.id = te.project_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE te.user_id = p_user_id
                    AND te.start_time >= p_start_date
                    AND te.start_time <= p_end_date
                    AND (p_project_id IS NULL OR te.project_id = p_project_id)
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
                GROUP BY p.id, p.name, p.color, c.name, c.currency
            ) project_data
        ), '[]'::json),
        'by_client', COALESCE((
            SELECT json_agg(client_data ORDER BY client_name NULLS LAST)
            FROM (
                SELECT
                    CASE
                        WHEN c.id IS NOT NULL THEN json_build_object('id', c.id, 'name', c.name)
                        ELSE NULL
                    END as client,
                    c.name as client_name,
                    COALESCE(c.currency, v_default_currency) as currency,
                    ROUND(SUM(te.duration_seconds)::NUMERIC / 3600, 2) as hours,
                    ROUND(SUM(
                        CASE WHEN te.is_billable THEN
                            (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)
                        ELSE 0 END
                    ), 2) as amount
                FROM time_entries te
                LEFT JOIN projects p ON p.id = te.project_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE te.user_id = p_user_id
                    AND te.start_time >= p_start_date
                    AND te.start_time <= p_end_date
                    AND (p_project_id IS NULL OR te.project_id = p_project_id)
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
                GROUP BY c.id, c.name, c.currency
            ) client_data
        ), '[]'::json),
        'by_day', COALESCE((
            SELECT json_agg(day_data ORDER BY date)
            FROM (
                SELECT
                    to_char(te.start_time::DATE, 'YYYY-MM-DD') as date,
                    ROUND(SUM(te.duration_seconds)::NUMERIC / 3600, 2) as hours,
                    ROUND(SUM(
                        CASE WHEN te.is_billable THEN
                            (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)
                        ELSE 0 END
                    ), 2) as amount
                FROM time_entries te
                LEFT JOIN projects p ON p.id = te.project_id
                WHERE te.user_id = p_user_id
                    AND te.start_time >= p_start_date
                    AND te.start_time <= p_end_date
                    AND (p_project_id IS NULL OR te.project_id = p_project_id)
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
                GROUP BY te.start_time::DATE
            ) day_data
        ), '[]'::json),
        'entries', COALESCE((
            SELECT json_agg(entry_data ORDER BY date DESC, id)
            FROM (
                SELECT
                    te.id,
                    to_char(te.start_time::DATE, 'YYYY-MM-DD') as date,
                    te.description,
                    p.name as project_name,
                    c.name as client_name,
                    te.duration_seconds,
                    te.is_billable,
                    COALESCE(te.hourly_rate, p.hourly_rate) as hourly_rate,
                    COALESCE(c.currency, v_default_currency) as currency,
                    ROUND(
                        CASE WHEN te.is_billable THEN
                            (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)
                        ELSE 0 END
                    , 2) as amount
                FROM time_entries te
                LEFT JOIN projects p ON p.id = te.project_id
                LEFT JOIN clients c ON c.id = p.client_id
                WHERE te.user_id = p_user_id
                    AND te.start_time >= p_start_date
                    AND te.start_time <= p_end_date
                    AND (p_project_id IS NULL OR te.project_id = p_project_id)
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
            ) entry_data
        ), '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
