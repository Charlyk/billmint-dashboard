-- Function to get user profile with settings in a single call
-- Creates default settings if they don't exist

CREATE OR REPLACE FUNCTION get_user_profile(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_user JSON;
    v_settings JSON;
    v_result JSON;
BEGIN
    -- Get user
    SELECT row_to_json(u.*) INTO v_user
    FROM users u
    WHERE u.id = p_user_id;

    IF v_user IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get or create settings
    SELECT row_to_json(us.*) INTO v_settings
    FROM user_settings us
    WHERE us.user_id = p_user_id;

    IF v_settings IS NULL THEN
        -- Create default settings
        INSERT INTO user_settings (user_id)
        VALUES (p_user_id)
        RETURNING row_to_json(user_settings.*) INTO v_settings;
    END IF;

    -- Combine user and settings
    SELECT json_build_object(
        'id', v_user->>'id',
        'email', v_user->>'email',
        'full_name', v_user->>'full_name',
        'company_name', v_user->>'company_name',
        'avatar_url', v_user->>'avatar_url',
        'tier', v_user->>'tier',
        'stripe_customer_id', v_user->>'stripe_customer_id',
        'stripe_subscription_id', v_user->>'stripe_subscription_id',
        'created_at', v_user->>'created_at',
        'updated_at', v_user->>'updated_at',
        'settings', v_settings
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get or create user settings

CREATE OR REPLACE FUNCTION get_user_settings(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_settings JSON;
BEGIN
    -- Try to get existing settings
    SELECT row_to_json(us.*) INTO v_settings
    FROM user_settings us
    WHERE us.user_id = p_user_id;

    -- Create default settings if they don't exist
    IF v_settings IS NULL THEN
        INSERT INTO user_settings (user_id)
        VALUES (p_user_id)
        RETURNING row_to_json(user_settings.*) INTO v_settings;
    END IF;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to upsert user settings (insert or update)

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
    p_max_timer_hours NUMERIC DEFAULT NULL
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
        time_format = COALESCE(p_time_format, time_format)::time_format,
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
            max_timer_hours
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
            COALESCE(p_max_timer_hours, 8)
        )
        RETURNING row_to_json(user_settings.*) INTO v_settings;
    END IF;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to delete user account and all related data

CREATE OR REPLACE FUNCTION delete_user_account(p_user_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Delete user settings (cascade should handle this, but explicit is safer)
    DELETE FROM user_settings WHERE user_id = p_user_id;

    -- Delete user profile
    DELETE FROM users WHERE id = p_user_id;

    RETURN json_build_object('deleted', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant permissions
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION get_user_settings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_settings(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION upsert_user_settings(UUID, TEXT, NUMERIC, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_settings(UUID, TEXT, NUMERIC, SMALLINT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO service_role;

GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO service_role;
