-- Function to list projects with stats calculated inline
-- Eliminates N+1 query problem by calculating stats in a single query

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
    v_result JSON;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Get user's default hourly rate
    SELECT default_hourly_rate INTO v_default_rate
    FROM user_settings
    WHERE user_id = p_user_id;

    -- Get total count
    SELECT COUNT(*) INTO v_total
    FROM projects p
    WHERE p.user_id = p_user_id
        AND (p_client_id IS NULL OR p.client_id = p_client_id)
        AND (p_include_archived = TRUE OR p.is_archived = FALSE)
        AND (p_search IS NULL OR p.name ILIKE '%' || p_search || '%');

    -- Get paginated projects with stats
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
                    p.currency,
                    p.is_billable,
                    p.is_default,
                    p.is_archived,
                    p.notes,
                    p.created_at,
                    p.updated_at,
                    CASE
                        WHEN c.id IS NOT NULL THEN json_build_object(
                            'id', c.id,
                            'name', c.name
                        )
                        ELSE NULL
                    END as client,
                    -- Calculate stats inline
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


-- Function to get a single project with stats

CREATE OR REPLACE FUNCTION get_project_with_stats(
    p_user_id UUID,
    p_project_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_default_rate NUMERIC;
    v_result JSON;
BEGIN
    -- Get user's default hourly rate
    SELECT default_hourly_rate INTO v_default_rate
    FROM user_settings
    WHERE user_id = p_user_id;

    SELECT json_build_object(
        'id', p.id,
        'user_id', p.user_id,
        'client_id', p.client_id,
        'name', p.name,
        'color', p.color,
        'hourly_rate', p.hourly_rate,
        'currency', p.currency,
        'is_billable', p.is_billable,
        'is_default', p.is_default,
        'is_archived', p.is_archived,
        'notes', p.notes,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'client', CASE
            WHEN c.id IS NOT NULL THEN json_build_object(
                'id', c.id,
                'name', c.name
            )
            ELSE NULL
        END,
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


-- Function to create a project with optional default handling

CREATE OR REPLACE FUNCTION create_project(
    p_user_id UUID,
    p_name TEXT,
    p_client_id UUID DEFAULT NULL,
    p_color TEXT DEFAULT '#6366f1',
    p_hourly_rate NUMERIC DEFAULT NULL,
    p_currency TEXT DEFAULT 'USD',
    p_is_billable BOOLEAN DEFAULT TRUE,
    p_is_default BOOLEAN DEFAULT FALSE,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_project_id UUID;
    v_result JSON;
BEGIN
    -- If this project is set as default, unset other defaults
    IF p_is_default THEN
        UPDATE projects
        SET is_default = FALSE, updated_at = NOW()
        WHERE user_id = p_user_id AND is_default = TRUE;
    END IF;

    -- Insert the project
    INSERT INTO projects (
        user_id,
        client_id,
        name,
        color,
        hourly_rate,
        currency,
        is_billable,
        is_default,
        notes
    ) VALUES (
        p_user_id,
        p_client_id,
        p_name,
        p_color,
        p_hourly_rate,
        p_currency,
        p_is_billable,
        p_is_default,
        p_notes
    )
    RETURNING id INTO v_project_id;

    -- Return the created project
    SELECT row_to_json(p.*) INTO v_result
    FROM projects p
    WHERE p.id = v_project_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete or archive a project

CREATE OR REPLACE FUNCTION delete_project(
    p_user_id UUID,
    p_project_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_entry_count INTEGER;
    v_result JSON;
BEGIN
    -- Check if project has any time entries
    SELECT COUNT(*) INTO v_entry_count
    FROM time_entries
    WHERE project_id = p_project_id;

    IF v_entry_count > 0 THEN
        -- Archive instead of delete
        UPDATE projects
        SET is_archived = TRUE, updated_at = NOW()
        WHERE id = p_project_id AND user_id = p_user_id
        RETURNING json_build_object('archived', TRUE, 'deleted', FALSE) INTO v_result;
    ELSE
        -- Actually delete
        DELETE FROM projects
        WHERE id = p_project_id AND user_id = p_user_id;

        v_result := json_build_object('archived', FALSE, 'deleted', TRUE);
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION list_projects(UUID, INTEGER, INTEGER, UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_projects(UUID, INTEGER, INTEGER, UUID, BOOLEAN, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION get_project_with_stats(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_with_stats(UUID, UUID) TO service_role;

GRANT EXECUTE ON FUNCTION create_project(UUID, TEXT, UUID, TEXT, NUMERIC, TEXT, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_project(UUID, TEXT, UUID, TEXT, NUMERIC, TEXT, BOOLEAN, BOOLEAN, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION delete_project(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_project(UUID, UUID) TO service_role;
