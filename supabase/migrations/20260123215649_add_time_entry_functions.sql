-- Function to list time entries with all filters including client_id
-- Returns paginated results with project and client details

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
    v_result JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get total count
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

    -- Get paginated entries with details
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


-- Function to get unbilled time entries with aggregation
-- Optionally filter by client

CREATE OR REPLACE FUNCTION get_unbilled_time_entries(
    p_user_id UUID,
    p_client_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
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


-- Function to create a time entry with automatic rate resolution
-- Resolves rate from: input → project → user default

CREATE OR REPLACE FUNCTION create_time_entry(
    p_user_id UUID,
    p_start_time TIMESTAMPTZ,
    p_project_id UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL,
    p_duration_seconds INTEGER DEFAULT NULL,
    p_is_billable BOOLEAN DEFAULT TRUE,
    p_hourly_rate NUMERIC DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_duration INTEGER;
    v_rate NUMERIC;
    v_entry_id UUID;
    v_result JSON;
BEGIN
    -- Calculate duration
    IF p_duration_seconds IS NOT NULL THEN
        v_duration := p_duration_seconds;
    ELSIF p_end_time IS NOT NULL THEN
        v_duration := EXTRACT(EPOCH FROM (p_end_time - p_start_time))::INTEGER;
    ELSE
        v_duration := 0;
    END IF;

    -- Resolve hourly rate: input → project → user default
    IF p_hourly_rate IS NOT NULL THEN
        v_rate := p_hourly_rate;
    ELSIF p_project_id IS NOT NULL THEN
        SELECT hourly_rate INTO v_rate
        FROM projects
        WHERE id = p_project_id;
    END IF;

    IF v_rate IS NULL THEN
        SELECT default_hourly_rate INTO v_rate
        FROM user_settings
        WHERE user_id = p_user_id;
    END IF;

    -- Insert the entry
    INSERT INTO time_entries (
        user_id,
        project_id,
        description,
        start_time,
        end_time,
        duration_seconds,
        is_billable,
        hourly_rate,
        notes
    ) VALUES (
        p_user_id,
        p_project_id,
        p_description,
        p_start_time,
        p_end_time,
        v_duration,
        p_is_billable,
        v_rate,
        p_notes
    )
    RETURNING id INTO v_entry_id;

    -- Return the created entry
    SELECT row_to_json(te.*) INTO v_result
    FROM time_entries te
    WHERE te.id = v_entry_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION list_time_entries(UUID, INTEGER, INTEGER, UUID, UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_time_entries(UUID, INTEGER, INTEGER, UUID, UUID, BOOLEAN, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION get_unbilled_time_entries(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unbilled_time_entries(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION create_time_entry(UUID, TIMESTAMPTZ, UUID, TEXT, TIMESTAMPTZ, INTEGER, BOOLEAN, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_time_entry(UUID, TIMESTAMPTZ, UUID, TEXT, TIMESTAMPTZ, INTEGER, BOOLEAN, NUMERIC, TEXT) TO service_role;
