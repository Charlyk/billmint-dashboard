-- Add billing_email column to user_settings
ALTER TABLE user_settings ADD COLUMN billing_email TEXT;

-- Recreate update_billing_defaults to accept billing_email
CREATE OR REPLACE FUNCTION update_billing_defaults(
    p_user_id UUID,
    p_default_currency TEXT DEFAULT NULL,
    p_default_hourly_rate NUMERIC DEFAULT NULL,
    p_billing_email TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_settings JSON;
BEGIN
    -- Ensure settings row exists
    INSERT INTO user_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Update billing defaults
    UPDATE user_settings
    SET
        default_currency = COALESCE(p_default_currency, default_currency),
        default_hourly_rate = CASE
            WHEN p_default_hourly_rate IS NOT NULL THEN p_default_hourly_rate
            ELSE default_hourly_rate
        END,
        billing_email = CASE
            WHEN p_billing_email IS NOT NULL THEN p_billing_email
            ELSE billing_email
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING row_to_json(user_settings.*) INTO v_settings;

    RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the new signature
GRANT EXECUTE ON FUNCTION update_billing_defaults(UUID, TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_billing_defaults(UUID, TEXT, NUMERIC, TEXT) TO service_role;
