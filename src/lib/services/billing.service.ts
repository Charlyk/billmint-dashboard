import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { ValidationError } from '@/lib/utils/errors'
import type { SubscriptionResponse, CheckoutSessionResponse, PortalSessionResponse, StripeInvoicesResponse } from '@/types/api'
import Stripe from 'stripe'
import { createServiceLogger } from '@/lib/logging/logger'
import { sanitizeError } from '@/lib/logging/sanitizers'
import { getCorrelationId } from '@/lib/logging/correlation'
import { serverAnalytics } from '@/lib/analytics/posthog-server'

const log = createServiceLogger('billing')

// Lazy initialization of Stripe to avoid build errors
let stripeInstance: Stripe | null = null
let stripeKeyUsed: string | null = null

function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new ValidationError('Stripe is not configured')
  }
  // Re-create instance if key has changed (e.g. rotation)
  if (!stripeInstance || stripeKeyUsed !== secretKey) {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-01-28.clover' as Stripe.LatestApiVersion,
    })
    stripeKeyUsed = secretKey
  }
  return stripeInstance
}

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
  business: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business',
}

export async function getSubscription(): Promise<SubscriptionResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('tier, stripe_subscription_id')
    .eq('id', currentUser.id)
    .single() as { data: { tier: 'free' | 'pro' | 'business'; stripe_subscription_id: string | null } | null }

  if (!user?.stripe_subscription_id) {
    return {
      tier: user?.tier || 'free',
      subscription: null,
    }
  }

  try {
    const subscription = await getStripe().subscriptions.retrieve(
      user.stripe_subscription_id
    )

    const item = subscription.items?.data?.[0]
    const periodEnd = item?.current_period_end
    const currentPeriodEnd = typeof periodEnd === 'number'
      ? new Date(periodEnd * 1000).toISOString()
      : typeof periodEnd === 'string'
        ? periodEnd
        : null

    if (!currentPeriodEnd) {
      return { tier: user.tier, subscription: null }
    }

    return {
      tier: user.tier,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: !!subscription.cancel_at_period_end,
      },
    }
  } catch (error) {
    log.error('Failed to retrieve Stripe subscription', {
      operation: 'getSubscription',
      userId: currentUser.id,
      error: sanitizeError(error)
    })
    return {
      tier: user.tier,
      subscription: null,
    }
  }
}

export async function createCheckoutSession(
  tier: 'pro' | 'business'
): Promise<CheckoutSessionResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', currentUser.id)
    .single() as { data: { email: string; stripe_customer_id: string | null } | null }

  if (!user) {
    throw new ValidationError('User not found')
  }

  // Create or get Stripe customer
  let customerId = user.stripe_customer_id

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: user.email,
      metadata: {
        user_id: currentUser.id,
      },
    })

    customerId = customer.id

    // Save customer ID
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId } as never)
      .eq('id', currentUser.id)
  }

  const priceId = PRICE_IDS[tier]
  if (!priceId) {
    throw new ValidationError('Invalid tier')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/settings?checkout=success`,
    cancel_url: `${appUrl}/dashboard/settings?checkout=cancelled`,
    metadata: {
      user_id: currentUser.id,
      tier,
    },
  })

  return { url: session.url! }
}

export async function createPortalSession(): Promise<PortalSessionResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', currentUser.id)
    .single() as { data: { stripe_customer_id: string | null } | null }

  if (!user?.stripe_customer_id) {
    throw new ValidationError('No billing account found')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await getStripe().billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${appUrl}/dashboard/settings`,
  })

  return { url: session.url }
}

export async function handleWebhook(
  body: string,
  signature: string
): Promise<void> {
  const startTime = Date.now()
  const correlationId = getCorrelationId() || crypto.randomUUID()

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new ValidationError('Stripe webhook secret is not configured')
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    log.error('Webhook signature validation failed', {
      correlationId,
      error: sanitizeError(err)
    })
    throw new ValidationError('Invalid webhook signature')
  }

  log.info('Webhook received', {
    correlationId,
    eventId: event.id,
    eventType: event.type
  })

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id
        const tier = session.metadata?.tier as 'pro' | 'business'

        if (userId && tier && session.subscription) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.rpc as any)('handle_stripe_webhook', {
            p_event_type: 'checkout.session.completed',
            p_user_id: userId,
            p_tier: tier,
            p_stripe_subscription_id: session.subscription as string,
          })

          // Track subscription activation (SSA-01)
          serverAnalytics.subscriptionActivated({ userId, tier })

          log.info('Webhook processed', {
            correlationId,
            eventId: event.id,
            eventType: event.type,
            userId,
            tier,
            duration: Date.now() - startTime
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.rpc as any)('handle_stripe_webhook', {
            p_event_type: 'customer.subscription.updated',
            p_stripe_customer_id: customerId,
          })

          // Track plan change (SSA-02)
          // Note: Using customerId as distinctId - webhook doesn't include userId
          serverAnalytics.planChanged({ userId: customerId, from_tier: 'paid', to_tier: 'free' })

          log.info('Webhook processed', {
            correlationId,
            eventId: event.id,
            eventType: event.type,
            customerId,
            subscriptionStatus: subscription.status,
            duration: Date.now() - startTime
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.rpc as any)('handle_stripe_webhook', {
          p_event_type: 'customer.subscription.deleted',
          p_stripe_customer_id: customerId,
        })

        // Track subscription cancellation (SSA-03)
        // Note: Using customerId as distinctId - webhook doesn't include userId
        serverAnalytics.subscriptionCancelled({ userId: customerId, tier: 'free' })

        log.info('Webhook processed', {
          correlationId,
          eventId: event.id,
          eventType: event.type,
          customerId,
          duration: Date.now() - startTime
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Could send notification to user about failed payment
        log.warn('Payment failed', {
          eventId: event.id,
          eventType: event.type,
          customerId
        })
        break
      }
    }
  } catch (processingError) {
    log.error('Webhook processing failed', {
      correlationId,
      eventId: event.id,
      eventType: event.type,
      duration: Date.now() - startTime,
      error: sanitizeError(processingError)
    })
    throw processingError  // Re-throw to trigger Stripe retry
  }
}

export async function getInvoices(): Promise<StripeInvoicesResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', currentUser.id)
    .single() as { data: { stripe_customer_id: string | null } | null }

  if (!user?.stripe_customer_id) {
    return { invoices: [] }
  }

  try {
    const stripeInvoices = await getStripe().invoices.list({
      customer: user.stripe_customer_id,
      limit: 24,
    })

    const invoices = stripeInvoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number ?? null,
      status: inv.status ?? 'unknown',
      amount_due: inv.amount_due,
      currency: inv.currency,
      created: new Date(inv.created * 1000).toISOString(),
      invoice_pdf: inv.invoice_pdf ?? null,
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
    }))

    return { invoices }
  } catch (error) {
    log.error('Failed to retrieve Stripe invoices', {
      operation: 'getInvoices',
      userId: currentUser.id,
      error: sanitizeError(error)
    })
    return { invoices: [] }
  }
}

export async function updateCustomerEmail(stripeCustomerId: string, email: string): Promise<void> {
  await getStripe().customers.update(stripeCustomerId, { email })
}

export async function isUserPaid(): Promise<boolean> {
  const currentUser = await requireAuth()
  return currentUser.tier !== 'free'
}
