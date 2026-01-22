import { fetcher } from './client'
import type {
  SubscriptionResponse,
  CheckoutSessionResponse,
  PortalSessionResponse,
} from '@/types/api'

export async function getSubscription(): Promise<SubscriptionResponse> {
  return fetcher<SubscriptionResponse>('/api/billing/subscription')
}

export async function createCheckoutSession(
  tier: 'pro' | 'business'
): Promise<CheckoutSessionResponse> {
  return fetcher<CheckoutSessionResponse>('/api/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ tier }),
  })
}

export async function createPortalSession(): Promise<PortalSessionResponse> {
  return fetcher<PortalSessionResponse>('/api/billing/portal', {
    method: 'POST',
  })
}
