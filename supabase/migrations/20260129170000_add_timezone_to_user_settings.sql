-- Add timezone column to user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

-- Update upsert_user_settings to include timezone
CREATE OR REPLACE FUNCTION upsert_user_settings(
    p_user_id UUID,
    p_default_currency TEXT DEFAULT NULL,
    p_default_hourly_rate NUMERIC DEFAULT NULL,
    p_week_starts_on SMALLINT DEFAULT NULL,
    p_time_format TEXT DEFAULT NULL,
    p_date_format TEXT DEFAULT NULL,
    p_invoice_prefix TEXT DEFAULT NULL,
    p_invoice_notes TEXT DEFAULT NULL,
    p_invoice_terms TEXT DEFAULT NULL,
    p_max_timer_hours NUMERIC DEFAULT NULL,
    p_timezone TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_settings JSON;
BEGIN
    -- Try to update existing settings
    UPDATE user_settings
    SET
        default_currency = COALESCE(p_default_currency, default_currency),
        default_hourly_rate = CASE
            WHEN p_default_hourly_rate IS NOT NULL THEN p_default_hourly_rate
            ELSE default_hourly_rate
        END,
        week_starts_on = COALESCE(p_week_starts_on, week_starts_on),
        time_format = CASE
            WHEN p_time_format IS NOT NULL THEN p_time_format::time_format
            ELSE time_format
        END,
        date_format = COALESCE(p_date_format, date_format),
        invoice_prefix = COALESCE(p_invoice_prefix, invoice_prefix),
        invoice_notes = CASE
            WHEN p_invoice_notes IS NOT NULL THEN p_invoice_notes
            ELSE invoice_notes
        END,
        invoice_terms = CASE
            WHEN p_invoice_terms IS NOT NULL THEN p_invoice_terms
            ELSE invoice_terms
        END,
        max_timer_hours = CASE
            WHEN p_max_timer_hours IS NOT NULL THEN p_max_timer_hours
            ELSE max_timer_hours
        END,
        timezone = COALESCE(p_timezone, timezone),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING row_to_json(user_settings.*) INTO v_settings;

    -- If no row was updated, insert new settings
    IF v_settings IS NULL THEN
        INSERT INTO user_settings (
            user_id,
            default_currency,
            default_hourly_rate,
            week_starts_on,
            time_format,
            date_format,
            invoice_prefix,
            invoice_notes,
            invoice_terms,
            max_timer_hours,
            timezone
        ) VALUES (
            p_user_id,
            COALESCE(p_default_currency, 'USD'),
            p_default_hourly_rate,
            COALESCE(p_week_starts_on, 0),
            COALESCE(p_time_format, '12h')::time_format,
            COALESCE(p_date_format, 'MM/DD/YYYY'),
            COALESCE(p_invoice_prefix, 'INV-'),
            p_invoice_notes,
            p_invoice_terms,
            COALESCE(p_max_timer_hours, 8),
            COALESCE(p_timezone, 'UTC')
        )
        RETURNING row_to_json(user_settings.*) INTO v_settings;
    END IF;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Update update_app_settings to include timezone
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

-- Update grant for new signature
GRANT EXECUTE ON FUNCTION update_app_settings(UUID, TEXT, SMALLINT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_app_settings(UUID, TEXT, SMALLINT, NUMERIC, TEXT) TO service_role;
