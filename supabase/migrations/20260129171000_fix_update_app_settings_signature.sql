-- Drop the old 4-parameter function signature
DROP FUNCTION IF EXISTS update_app_settings(UUID, TEXT, SMALLINT, NUMERIC);

-- Recreate with timezone parameter (already exists from previous migration, but ensure it's correct)
CREATE OR REPLACE FUNCTION update_app_settings(
    p_user_id UUID,
    p_time_format TEXT DEFAULT NULL,
    p_week_starts_on SMALLINT DEFAULT NULL,
    p_max_timer_hours NUMERIC DEFAULT NULL,
    p_timezone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_settings JSON;
BEGIN
    -- Ensure settings row exists
    INSERT INTO user_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update app settings
    UPDATE user_settings
    SET
        time_format = CASE
            WHEN p_time_format IS NOT NULL THEN p_time_format::time_format
            ELSE time_format
        END,
        week_starts_on = COALESCE(p_week_starts_on, week_starts_on),
        max_timer_hours = CASE
            WHEN p_max_timer_hours IS NOT NULL THEN p_max_timer_hours
            ELSE max_timer_hours
        END,
        timezone = COALESCE(p_timezone, timezone),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING row_to_json(user_settings.*) INTO v_settings;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_app_settings(UUID, TEXT, SMALLINT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_app_settings(UUID, TEXT, SMALLINT, NUMERIC, TEXT) TO service_role;
