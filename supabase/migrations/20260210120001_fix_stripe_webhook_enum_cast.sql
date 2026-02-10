-- Fix: cast TEXT values to user_tier enum in handle_stripe_webhook
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
      SET tier = p_tier::user_tier,
          stripe_subscription_id = p_stripe_subscription_id,
          updated_at = now()
      WHERE id = p_user_id;

    WHEN 'customer.subscription.updated' THEN
      UPDATE users
      SET tier = 'free'::user_tier,
          stripe_subscription_id = NULL,
          updated_at = now()
      WHERE stripe_customer_id = p_stripe_customer_id;

    WHEN 'customer.subscription.deleted' THEN
      UPDATE users
      SET tier = 'free'::user_tier,
          stripe_subscription_id = NULL,
          updated_at = now()
      WHERE stripe_customer_id = p_stripe_customer_id;

    ELSE
      -- Unknown event type, do nothing
      NULL;
  END CASE;
END;
$$;
