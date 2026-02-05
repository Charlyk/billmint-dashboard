-- Add total_invoices count to the get_dashboard_data function
-- This allows the onboarding checklist to detect if user has created any invoices

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
    v_result JSON;
BEGIN
    -- Calculate date ranges
    v_today_start := date_trunc('day', NOW());
    v_today_end := v_today_start + INTERVAL '1 day' - INTERVAL '1 millisecond';

    -- Week starts on Sunday (adjust if needed)
    v_week_start := date_trunc('week', NOW()) - INTERVAL '1 day';
    v_week_end := v_week_start + INTERVAL '7 days' - INTERVAL '1 millisecond';

    v_month_start := date_trunc('month', NOW());
    v_month_end := (date_trunc('month', NOW()) + INTERVAL '1 month') - INTERVAL '1 millisecond';

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
                                    COALESCE(p.currency, 'USD') as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.start_time >= v_today_start
                                    AND te2.start_time <= v_today_end
                                    AND te2.is_billable = TRUE
                                GROUP BY COALESCE(p.currency, 'USD')
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
                                    COALESCE(p.currency, 'USD') as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.start_time >= v_week_start
                                    AND te2.start_time <= v_week_end
                                    AND te2.is_billable = TRUE
                                GROUP BY COALESCE(p.currency, 'USD')
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
                                    COALESCE(p.currency, 'USD') as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.start_time >= v_month_start
                                    AND te2.start_time <= v_month_end
                                    AND te2.is_billable = TRUE
                                GROUP BY COALESCE(p.currency, 'USD')
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
                                    COALESCE(p.currency, 'USD') as currency,
                                    SUM((te2.duration_seconds::NUMERIC / 3600) * COALESCE(te2.hourly_rate, p.hourly_rate, 0)) as amount
                                FROM time_entries te2
                                LEFT JOIN projects p ON p.id = te2.project_id
                                WHERE te2.user_id = p_user_id
                                    AND te2.is_billable = TRUE
                                    AND te2.invoice_id IS NULL
                                GROUP BY COALESCE(p.currency, 'USD')
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
                ),
                'total_invoices', (
                    SELECT COUNT(*)::INTEGER
                    FROM invoices
                    WHERE user_id = p_user_id
                ),
                'total_time_entries', (
                    SELECT COUNT(*)::INTEGER
                    FROM time_entries
                    WHERE user_id = p_user_id
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
                            'hourly_rate', p.hourly_rate,
                            'currency', p.currency
                        )
                        ELSE NULL
                    END as project,
                    CASE
                        WHEN c.id IS NOT NULL THEN json_build_object(
                            'id', c.id,
                            'name', c.name
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
