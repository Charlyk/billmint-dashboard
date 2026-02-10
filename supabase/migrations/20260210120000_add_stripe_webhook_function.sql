-- RPC function for Stripe webhook database updates.
-- Runs as SECURITY DEFINER so it bypasses RLS (webhooks have no user session).
CREATE OR REPLACE FUNCTION handle_stripe_webhook(
  p_event_type TEXT,
  p_user_id UUID DEFAULT NULL,
  p_stripe_customer_id TEXT DEFAULT NULL,
  p_tier TEXT DEFAULT NULL,
  p_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_event_type
    WHEN 'checkout.session.completed' THEN
      UPDATE users
      SET tier = p_tier,
          stripe_subscription_id = p_stripe_subscription_id,
          updated_at = now()
      WHERE id = p_user_id;

    WHEN 'customer.subscription.updated' THEN
      UPDATE users
      SET tier = 'free',
          stripe_subscription_id = NULL,
          updated_at = now()
      WHERE stripe_customer_id = p_stripe_customer_id;

    WHEN 'customer.subscription.deleted' THEN
      UPDATE users
      SET tier = 'free',
          stripe_subscription_id = NULL,
          updated_at = now()
      WHERE stripe_customer_id = p_stripe_customer_id;

    ELSE
      -- Unknown event type, do nothing
      NULL;
  END CASE;
END;
$$;

-- Only allow service_role to call this function
REVOKE ALL ON FUNCTION handle_stripe_webhook(TEXT, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION handle_stripe_webhook(TEXT, UUID, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION handle_stripe_webhook(TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
