-- Function to find and pause all stale timers in a single atomic operation
-- Returns the paused timers with all data needed for sending notification emails

CREATE OR REPLACE FUNCTION autopause_stale_timers()
RETURNS TABLE (
    timer_id UUID,
    user_email TEXT,
    user_full_name TEXT,
    description TEXT,
    project_name TEXT,
    start_time TIMESTAMPTZ,
    max_timer_hours NUMERIC,
    paused_at TIMESTAMPTZ,
    capped_elapsed_seconds INTEGER
) AS $$
DECLARE
    default_max_hours CONSTANT NUMERIC := 8;
BEGIN
    -- Create a temp table to store the timers we're going to pause
    CREATE TEMP TABLE timers_to_pause ON COMMIT DROP AS
    SELECT
        at.id AS timer_id,
        at.user_id,
        at.start_time,
        at.elapsed_seconds,
        at.description,
        u.email AS user_email,
        u.full_name AS user_full_name,
        p.name AS project_name,
        -- Get max_timer_hours: NULL means unlimited, undefined defaults to 8
        COALESCE(us.max_timer_hours, default_max_hours) AS effective_max_hours,
        us.max_timer_hours AS raw_max_hours
    FROM active_timers at
    INNER JOIN users u ON u.id = at.user_id
    LEFT JOIN user_settings us ON us.user_id = at.user_id
    LEFT JOIN projects p ON p.id = at.project_id
    WHERE at.is_paused = FALSE;

    -- Filter to only timers that exceed their limit
    -- Skip timers where max_timer_hours is explicitly NULL (unlimited)
    DELETE FROM timers_to_pause
    WHERE raw_max_hours IS NULL
       OR (
           -- Calculate total elapsed: stored + running time since start
           elapsed_seconds + EXTRACT(EPOCH FROM (NOW() - start_time))
       ) < (effective_max_hours * 3600);

    -- Update the timers that need to be paused
    UPDATE active_timers at
    SET
        is_paused = TRUE,
        -- Calculate the exact pause timestamp (when the limit was reached)
        paused_at = ttp.start_time + (
            (ttp.effective_max_hours * 3600 - ttp.elapsed_seconds) * INTERVAL '1 second'
        ),
        -- Cap elapsed_seconds at the max limit
        elapsed_seconds = (ttp.effective_max_hours * 3600)::INTEGER,
        updated_at = NOW()
    FROM timers_to_pause ttp
    WHERE at.id = ttp.timer_id;

    -- Return the paused timers with all the data needed for emails
    RETURN QUERY
    SELECT
        ttp.timer_id,
        ttp.user_email,
        ttp.user_full_name,
        ttp.description,
        ttp.project_name,
        ttp.start_time,
        ttp.effective_max_hours AS max_timer_hours,
        -- Calculate the paused_at timestamp for the return value
        ttp.start_time + (
            (ttp.effective_max_hours * 3600 - ttp.elapsed_seconds) * INTERVAL '1 second'
        ) AS paused_at,
        (ttp.effective_max_hours * 3600)::INTEGER AS capped_elapsed_seconds
    FROM timers_to_pause ttp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to the service role (used by cron jobs)
GRANT EXECUTE ON FUNCTION autopause_stale_timers() TO service_role;
