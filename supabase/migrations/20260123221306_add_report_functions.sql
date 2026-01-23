-- Function to generate a complete time report with all aggregations
-- Returns summary, by_project, by_client, and by_day in a single call

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
BEGIN
    SELECT json_build_object(
        'period', json_build_object(
            'start', p_start_date,
            'end', p_end_date
        ),
        'summary', (
            SELECT json_build_object(
                'total_hours', COALESCE(ROUND(SUM(te.duration_seconds)::NUMERIC / 3600, 2), 0),
                'total_amount', COALESCE(ROUND(SUM(
                    (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)
                ), 2), 0),
                'billable_hours', COALESCE(ROUND(SUM(
                    CASE WHEN te.is_billable THEN te.duration_seconds ELSE 0 END
                )::NUMERIC / 3600, 2), 0),
                'billable_amount', COALESCE(ROUND(SUM(
                    CASE WHEN te.is_billable THEN
                        (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)
                    ELSE 0 END
                ), 2), 0),
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
                    p.name as project_name,
                    ROUND(SUM(te.duration_seconds)::NUMERIC / 3600, 2) as hours,
                    ROUND(SUM(
                        CASE WHEN te.is_billable THEN
                            (te.duration_seconds::NUMERIC / 3600) * COALESCE(te.hourly_rate, p.hourly_rate, 0)
                        ELSE 0 END
                    ), 2) as amount
                FROM time_entries te
                INNER JOIN projects p ON p.id = te.project_id
                WHERE te.user_id = p_user_id
                    AND te.start_time >= p_start_date
                    AND te.start_time <= p_end_date
                    AND (p_project_id IS NULL OR te.project_id = p_project_id)
                    AND (p_client_id IS NULL OR p.client_id = p_client_id)
                GROUP BY p.id, p.name, p.color
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
                GROUP BY c.id, c.name
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
        ), '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION generate_time_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_time_report(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID, UUID) TO service_role;
