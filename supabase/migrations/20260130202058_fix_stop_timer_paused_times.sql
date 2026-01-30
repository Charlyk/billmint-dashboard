-- Fix stop_timer to use correct start/end times for paused timers
-- Previously, it calculated times relative to NOW() which was incorrect for paused timers

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

    -- Calculate start and end times based on timer state
    v_start_time := v_timer.start_time;
    IF v_timer.is_paused THEN
        v_end_time := v_timer.paused_at;
    ELSE
        v_end_time := NOW();
    END IF;

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
