-- Function to get active timer with project info and auto-pause check
-- Returns timer with project, and auto-pauses if max_timer_hours exceeded

CREATE OR REPLACE FUNCTION get_active_timer(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_timer RECORD;
    v_max_timer_hours NUMERIC;
    v_elapsed_seconds INTEGER;
    v_max_seconds INTEGER;
    v_paused_at TIMESTAMPTZ;
    v_auto_paused BOOLEAN := FALSE;
    v_result JSON;
BEGIN
    -- Get timer with project
    SELECT
        at.*,
        json_build_object('id', p.id, 'name', p.name, 'color', p.color) as project_json
    INTO v_timer
    FROM active_timers at
    LEFT JOIN projects p ON p.id = at.project_id
    WHERE at.user_id = p_user_id;

    IF v_timer.id IS NULL THEN
        RETURN json_build_object('timer', NULL, 'project', NULL, 'autoPaused', FALSE);
    END IF;

    -- Get max_timer_hours setting
    SELECT max_timer_hours INTO v_max_timer_hours
    FROM user_settings
    WHERE user_id = p_user_id;

    -- Check if auto-pause should trigger
    IF v_max_timer_hours IS NOT NULL AND NOT v_timer.is_paused THEN
        v_max_seconds := (v_max_timer_hours * 3600)::INTEGER;
        v_elapsed_seconds := COALESCE(v_timer.elapsed_seconds, 0) +
            EXTRACT(EPOCH FROM (NOW() - v_timer.start_time))::INTEGER;

        IF v_elapsed_seconds >= v_max_seconds THEN
            -- Calculate exact pause timestamp
            v_paused_at := v_timer.start_time +
                ((v_max_seconds - COALESCE(v_timer.elapsed_seconds, 0)) * INTERVAL '1 second');

            -- Update timer to paused state
            UPDATE active_timers
            SET
                is_paused = TRUE,
                paused_at = v_paused_at,
                elapsed_seconds = v_max_seconds,
                updated_at = NOW()
            WHERE id = v_timer.id;

            -- Update local record
            v_timer.is_paused := TRUE;
            v_timer.paused_at := v_paused_at;
            v_timer.elapsed_seconds := v_max_seconds;
            v_auto_paused := TRUE;
        END IF;
    END IF;

    -- Build result
    SELECT json_build_object(
        'timer', json_build_object(
            'id', v_timer.id,
            'user_id', v_timer.user_id,
            'project_id', v_timer.project_id,
            'description', v_timer.description,
            'start_time', v_timer.start_time,
            'elapsed_seconds', v_timer.elapsed_seconds,
            'is_billable', v_timer.is_billable,
            'is_paused', v_timer.is_paused,
            'paused_at', v_timer.paused_at,
            'created_at', v_timer.created_at,
            'updated_at', v_timer.updated_at
        ),
        'project', CASE WHEN v_timer.project_id IS NOT NULL THEN v_timer.project_json ELSE NULL END,
        'autoPaused', v_auto_paused
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to start a new timer (checks for existing timer first)

CREATE OR REPLACE FUNCTION start_timer(
    p_user_id UUID,
    p_description TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_is_billable BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
    v_existing_id UUID;
    v_timer RECORD;
    v_result JSON;
BEGIN
    -- Check for existing timer
    SELECT id INTO v_existing_id
    FROM active_timers
    WHERE user_id = p_user_id;

    IF v_existing_id IS NOT NULL THEN
        RAISE EXCEPTION 'CONFLICT: A timer is already running';
    END IF;

    -- Insert new timer
    INSERT INTO active_timers (
        user_id,
        description,
        project_id,
        is_billable,
        start_time,
        elapsed_seconds,
        is_paused
    ) VALUES (
        p_user_id,
        p_description,
        p_project_id,
        p_is_billable,
        NOW(),
        0,
        FALSE
    )
    RETURNING * INTO v_timer;

    -- Get project info
    SELECT json_build_object(
        'timer', json_build_object(
            'id', v_timer.id,
            'user_id', v_timer.user_id,
            'project_id', v_timer.project_id,
            'description', v_timer.description,
            'start_time', v_timer.start_time,
            'elapsed_seconds', v_timer.elapsed_seconds,
            'is_billable', v_timer.is_billable,
            'is_paused', v_timer.is_paused,
            'paused_at', v_timer.paused_at,
            'created_at', v_timer.created_at,
            'updated_at', v_timer.updated_at
        ),
        'project', (
            SELECT json_build_object('id', p.id, 'name', p.name, 'color', p.color)
            FROM projects p
            WHERE p.id = v_timer.project_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to stop timer and create time entry atomically

CREATE OR REPLACE FUNCTION stop_timer(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_timer RECORD;
    v_total_seconds INTEGER;
    v_end_time TIMESTAMPTZ;
    v_start_time TIMESTAMPTZ;
    v_entry_id UUID;
    v_hourly_rate NUMERIC;
    v_result JSON;
BEGIN
    -- Get and delete timer in one operation
    DELETE FROM active_timers
    WHERE user_id = p_user_id
    RETURNING * INTO v_timer;

    IF v_timer.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: No active timer to stop';
    END IF;

    -- Calculate total elapsed time
    v_total_seconds := COALESCE(v_timer.elapsed_seconds, 0);
    IF NOT v_timer.is_paused AND v_timer.start_time IS NOT NULL THEN
        v_total_seconds := v_total_seconds +
            EXTRACT(EPOCH FROM (NOW() - v_timer.start_time))::INTEGER;
    END IF;

    -- Calculate start and end times
    v_end_time := NOW();
    v_start_time := v_end_time - (v_total_seconds * INTERVAL '1 second');

    -- Get hourly rate (from project or user settings)
    IF v_timer.project_id IS NOT NULL THEN
        SELECT hourly_rate INTO v_hourly_rate
        FROM projects
        WHERE id = v_timer.project_id;
    END IF;

    IF v_hourly_rate IS NULL THEN
        SELECT default_hourly_rate INTO v_hourly_rate
        FROM user_settings
        WHERE user_id = p_user_id;
    END IF;

    -- Create time entry
    INSERT INTO time_entries (
        user_id,
        project_id,
        description,
        start_time,
        end_time,
        duration_seconds,
        is_billable,
        hourly_rate
    ) VALUES (
        p_user_id,
        v_timer.project_id,
        v_timer.description,
        v_start_time,
        v_end_time,
        v_total_seconds,
        v_timer.is_billable,
        v_hourly_rate
    )
    RETURNING id INTO v_entry_id;

    -- Return the created time entry
    SELECT row_to_json(te.*) INTO v_result
    FROM time_entries te
    WHERE te.id = v_entry_id;

    RETURN json_build_object('timeEntry', v_result);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to pause timer atomically

CREATE OR REPLACE FUNCTION pause_timer(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_timer RECORD;
    v_new_elapsed INTEGER;
    v_result JSON;
BEGIN
    -- Get current timer
    SELECT * INTO v_timer
    FROM active_timers
    WHERE user_id = p_user_id;

    IF v_timer.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: No active timer to pause';
    END IF;

    IF v_timer.is_paused THEN
        RAISE EXCEPTION 'CONFLICT: Timer is already paused';
    END IF;

    -- Calculate new elapsed time
    v_new_elapsed := COALESCE(v_timer.elapsed_seconds, 0) +
        EXTRACT(EPOCH FROM (NOW() - v_timer.start_time))::INTEGER;

    -- Update timer
    UPDATE active_timers
    SET
        is_paused = TRUE,
        paused_at = NOW(),
        elapsed_seconds = v_new_elapsed,
        updated_at = NOW()
    WHERE id = v_timer.id
    RETURNING * INTO v_timer;

    -- Build result with project
    SELECT json_build_object(
        'timer', json_build_object(
            'id', v_timer.id,
            'user_id', v_timer.user_id,
            'project_id', v_timer.project_id,
            'description', v_timer.description,
            'start_time', v_timer.start_time,
            'elapsed_seconds', v_timer.elapsed_seconds,
            'is_billable', v_timer.is_billable,
            'is_paused', v_timer.is_paused,
            'paused_at', v_timer.paused_at,
            'created_at', v_timer.created_at,
            'updated_at', v_timer.updated_at
        ),
        'project', (
            SELECT json_build_object('id', p.id, 'name', p.name, 'color', p.color)
            FROM projects p
            WHERE p.id = v_timer.project_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to resume timer atomically

CREATE OR REPLACE FUNCTION resume_timer(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_timer RECORD;
    v_result JSON;
BEGIN
    -- Get current timer
    SELECT * INTO v_timer
    FROM active_timers
    WHERE user_id = p_user_id;

    IF v_timer.id IS NULL THEN
        RAISE EXCEPTION 'NOT_FOUND: No active timer to resume';
    END IF;

    IF NOT v_timer.is_paused THEN
        RAISE EXCEPTION 'CONFLICT: Timer is not paused';
    END IF;

    -- Update timer
    UPDATE active_timers
    SET
        is_paused = FALSE,
        paused_at = NULL,
        start_time = NOW(),
        updated_at = NOW()
    WHERE id = v_timer.id
    RETURNING * INTO v_timer;

    -- Build result with project
    SELECT json_build_object(
        'timer', json_build_object(
            'id', v_timer.id,
            'user_id', v_timer.user_id,
            'project_id', v_timer.project_id,
            'description', v_timer.description,
            'start_time', v_timer.start_time,
            'elapsed_seconds', v_timer.elapsed_seconds,
            'is_billable', v_timer.is_billable,
            'is_paused', v_timer.is_paused,
            'paused_at', v_timer.paused_at,
            'created_at', v_timer.created_at,
            'updated_at', v_timer.updated_at
        ),
        'project', (
            SELECT json_build_object('id', p.id, 'name', p.name, 'color', p.color)
            FROM projects p
            WHERE p.id = v_timer.project_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to sync timer (upsert)

CREATE OR REPLACE FUNCTION sync_timer(
    p_user_id UUID,
    p_start_time TIMESTAMPTZ,
    p_elapsed_seconds INTEGER,
    p_description TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_is_billable BOOLEAN DEFAULT TRUE
)
RETURNS JSON AS $$
DECLARE
    v_timer RECORD;
    v_result JSON;
BEGIN
    -- Try to update existing timer
    UPDATE active_timers
    SET
        description = p_description,
        project_id = p_project_id,
        is_billable = p_is_billable,
        start_time = p_start_time,
        elapsed_seconds = p_elapsed_seconds,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_timer;

    -- If no existing timer, insert new one
    IF v_timer.id IS NULL THEN
        INSERT INTO active_timers (
            user_id,
            description,
            project_id,
            is_billable,
            start_time,
            elapsed_seconds,
            is_paused
        ) VALUES (
            p_user_id,
            p_description,
            p_project_id,
            p_is_billable,
            p_start_time,
            p_elapsed_seconds,
            FALSE
        )
        RETURNING * INTO v_timer;
    END IF;

    -- Build result with project
    SELECT json_build_object(
        'timer', json_build_object(
            'id', v_timer.id,
            'user_id', v_timer.user_id,
            'project_id', v_timer.project_id,
            'description', v_timer.description,
            'start_time', v_timer.start_time,
            'elapsed_seconds', v_timer.elapsed_seconds,
            'is_billable', v_timer.is_billable,
            'is_paused', v_timer.is_paused,
            'paused_at', v_timer.paused_at,
            'created_at', v_timer.created_at,
            'updated_at', v_timer.updated_at
        ),
        'project', (
            SELECT json_build_object('id', p.id, 'name', p.name, 'color', p.color)
            FROM projects p
            WHERE p.id = v_timer.project_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION get_active_timer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_timer(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION start_timer(UUID, TEXT, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION start_timer(UUID, TEXT, UUID, BOOLEAN) TO service_role;

GRANT EXECUTE ON FUNCTION stop_timer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION stop_timer(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION pause_timer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION pause_timer(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION resume_timer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION resume_timer(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION sync_timer(UUID, TIMESTAMPTZ, INTEGER, TEXT, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_timer(UUID, TIMESTAMPTZ, INTEGER, TEXT, UUID, BOOLEAN) TO service_role;
