import { fetcher } from './client'
import type {
  SubscriptionResponse,
  CheckoutSessionResponse,
  PortalSessionResponse,
  StripeInvoicesResponse,
} from '@/types/api'
import { analytics } from '@/lib/analytics/events'

// Note: subscription_activated, plan_changed, and subscription_cancelled events
// are triggered by Stripe webhooks (server-side) and require posthog-node for tracking.
// checkout_started is tracked here as the client-side billing funnel entry point.

export async function getSubscription(): Promise<SubscriptionResponse> {
  return fetcher<SubscriptionResponse>('/api/billing/subscription')
}

export async function createCheckoutSession(
  tier: 'pro' | 'business'
): Promise<CheckoutSessionResponse> {
  const result = await fetcher<CheckoutSessionResponse>('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  })
  analytics.checkoutStarted({ tier })
  return result
}

export async function createPortalSession(): Promise<PortalSessionResponse> {
  return fetcher<PortalSessionResponse>('/api/billing/portal', {
    method: 'POST',
  })
}

export async function getInvoices(): Promise<StripeInvoicesResponse> {
  return fetcher<StripeInvoicesResponse>('/api/billing/invoices')
}
