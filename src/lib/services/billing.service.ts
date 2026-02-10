import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { ValidationError } from '@/lib/utils/errors'
import type { SubscriptionResponse, CheckoutSessionResponse, PortalSessionResponse } from '@/types/api'
import Stripe from 'stripe'

// Lazy initialization of Stripe to avoid build errors
let stripeInstance: Stripe | null = null

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new ValidationError('Stripe is not configured')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover' as Stripe.LatestApiVersion,
    })
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
    ) as Stripe.Subscription

    return {
      tier: user.tier,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: new Date(
          (subscription as unknown as { current_period_end: number }).current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end: (subscription as unknown as { cancel_at_period_end: boolean }).cancel_at_period_end,
      },
    }
  } catch {
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    throw new ValidationError('Invalid webhook signature')
  }

  const supabase = createAdminClient()

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
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Could send notification to user about failed payment
      console.log(`Payment failed for customer ${customerId}`)
      break
    }
  }
}

export async function isUserPaid(): Promise<boolean> {
  const currentUser = await requireAuth()
  return currentUser.tier !== 'free'
}
