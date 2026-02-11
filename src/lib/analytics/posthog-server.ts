/**
 * Server-side PostHog client for webhook and API route tracking.
 *
 * Production-only gating: Only initializes when VERCEL_ENV === 'production'
 * and NEXT_PUBLIC_POSTHOG_KEY is set.
 *
 * Graceful shutdown: Registers SIGTERM/SIGINT handlers to flush events on exit.
 *
 * Privacy: Uses userId (Supabase UUID) as distinctId. No person profiles
 * created since we don't pass $set properties (anonymous capture only).
 */

import { PostHog } from 'posthog-node'
import { isProduction, POSTHOG_KEY, POSTHOG_HOST } from './posthog'

let client: PostHog | null = null
let shutdownRegistered = false

/**
 * Get PostHog server client singleton.
 * Returns null if not in production or missing credentials.
 * Lazy-initializes on first call.
 */
function getPostHogServer(): PostHog | null {
  // Gate: production only with valid key
  if (!isProduction || !POSTHOG_KEY) {
    return null
  }

  // Create client on first call
  if (!client) {
    client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      // Flush immediately - webhook events are low-volume and must not be lost
      flushAt: 1,
      flushInterval: 0,
    })

    // Register graceful shutdown handlers once
    if (!shutdownRegistered) {
      const shutdown = async () => {
        if (client) {
          await client.shutdown()
        }
      }

      process.on('SIGTERM', shutdown)
      process.on('SIGINT', shutdown)
      shutdownRegistered = true
    }
  }

  return client
}

/**
 * Server-side analytics event helpers for billing lifecycle.
 * All methods silently no-op when PostHog is unavailable.
 */
export const serverAnalytics = {
  /**
   * Track subscription activation (SSA-01).
   * Fires after checkout.session.completed webhook.
   */
  subscriptionActivated(props: { userId: string; tier: 'pro' | 'business' }) {
    const client = getPostHogServer()
    if (!client) return

    try {
      client.capture({
        distinctId: props.userId,
        event: 'subscription_activated',
        properties: {
          tier: props.tier,
        },
      })
    } catch {
      // Silent catch - never break webhooks for analytics
    }
  },

  /**
   * Track plan change (SSA-02).
   * Fires after customer.subscription.updated webhook.
   */
  planChanged(props: { userId: string; from_tier: string; to_tier: string }) {
    const client = getPostHogServer()
    if (!client) return

    try {
      client.capture({
        distinctId: props.userId,
        event: 'plan_changed',
        properties: {
          from_tier: props.from_tier,
          to_tier: props.to_tier,
        },
      })
    } catch {
      // Silent catch - never break webhooks for analytics
    }
  },

  /**
   * Track subscription cancellation (SSA-03).
   * Fires after customer.subscription.deleted webhook.
   */
  subscriptionCancelled(props: { userId: string; tier: string }) {
    const client = getPostHogServer()
    if (!client) return

    try {
      client.capture({
        distinctId: props.userId,
        event: 'subscription_cancelled',
        properties: {
          tier: props.tier,
        },
      })
    } catch {
      // Silent catch - never break webhooks for analytics
    }
  },
}
