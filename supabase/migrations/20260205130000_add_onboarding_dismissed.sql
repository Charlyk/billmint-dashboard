-- Add onboarding_dismissed_at column to user_settings table
-- This tracks whether/when the user dismissed the onboarding checklist

ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS onboarding_dismissed_at TIMESTAMPTZ;

-- Update the upsert_user_settings function to include the new column
CREATE OR REPLACE FUNCTION upsert_user_settings(
    p_user_id UUID,
    p_default_currency TEXT DEFAULT NULL,
    p_default_hourly_rate NUMERIC DEFAULT NULL,
    p_week_starts_on INTEGER DEFAULT NULL,
    p_time_format TEXT DEFAULT NULL,
    p_date_format TEXT DEFAULT NULL,
    p_invoice_prefix TEXT DEFAULT NULL,
    p_invoice_notes TEXT DEFAULT NULL,
    p_invoice_terms TEXT DEFAULT NULL,
    p_max_timer_hours INTEGER DEFAULT NULL,
    p_onboarding_dismissed_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS user_settings AS $$
DECLARE
    v_result user_settings;
BEGIN
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
        onboarding_dismissed_at,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        COALESCE(p_default_currency, 'USD'),
        p_default_hourly_rate,
        COALESCE(p_week_starts_on, 0),
        COALESCE(p_time_format, '12h')::time_format_type,
        COALESCE(p_date_format, 'MM/DD/YYYY'),
        COALESCE(p_invoice_prefix, 'INV-'),
        p_invoice_notes,
        p_invoice_terms,
        COALESCE(p_max_timer_hours, 8),
        p_onboarding_dismissed_at,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        default_currency = COALESCE(p_default_currency, user_settings.default_currency),
        default_hourly_rate = COALESCE(p_default_hourly_rate, user_settings.default_hourly_rate),
        week_starts_on = COALESCE(p_week_starts_on, user_settings.week_starts_on),
        time_format = COALESCE(p_time_format::time_format_type, user_settings.time_format),
        date_format = COALESCE(p_date_format, user_settings.date_format),
        invoice_prefix = COALESCE(p_invoice_prefix, user_settings.invoice_prefix),
        invoice_notes = CASE WHEN p_invoice_notes IS NOT NULL THEN p_invoice_notes ELSE user_settings.invoice_notes END,
        invoice_terms = CASE WHEN p_invoice_terms IS NOT NULL THEN p_invoice_terms ELSE user_settings.invoice_terms END,
        max_timer_hours = CASE WHEN p_max_timer_hours IS NOT NULL THEN p_max_timer_hours ELSE user_settings.max_timer_hours END,
        onboarding_dismissed_at = COALESCE(p_onboarding_dismissed_at, user_settings.onboarding_dismissed_at),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a dedicated function for dismissing onboarding (simpler API)
CREATE OR REPLACE FUNCTION dismiss_onboarding(p_user_id UUID)
RETURNS user_settings AS $$
DECLARE
    v_result user_settings;
BEGIN
    UPDATE user_settings
    SET
        onboarding_dismissed_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO v_result;

    -- If no row existed, create one with the dismissed timestamp
    IF v_result IS NULL THEN
        INSERT INTO user_settings (user_id, onboarding_dismissed_at, created_at, updated_at)
        VALUES (p_user_id, NOW(), NOW(), NOW())
        RETURNING * INTO v_result;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION dismiss_onboarding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION dismiss_onboarding(UUID) TO service_role;
