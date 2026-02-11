/**
 * Centralized analytics event tracking module.
 *
 * Privacy Rules:
 * - IDs only (user_id, project_id, invoice_id, etc.)
 * - Counts and lengths (line_item_count, description_length, duration_seconds)
 * - NEVER content (descriptions, names, emails)
 * - NEVER PII (personal identifiable information)
 *
 * Environment Gating:
 * - Production-only via isProduction check
 * - Browser-only via typeof window check
 * - Silent no-op when checks fail (never break app for analytics)
 */

import posthog from 'posthog-js'
import { isProduction } from './posthog'

/**
 * Internal track helper with environment and browser safety.
 * Silently no-ops when:
 * - Not in browser (server-side render)
 * - Not in production (dev/preview environments)
 */
function track(eventName: string, properties?: Record<string, unknown>): void {
  // Server-side safety - posthog-js is client-only
  if (typeof window === 'undefined') return

  // Environment gating - production only
  if (!isProduction) return

  try {
    posthog.capture(eventName, properties)
  } catch {
    // Silent catch - never break app for analytics
  }
}

/**
 * Typed analytics event helpers.
 * All events follow object_action naming with past tense.
 */
export const analytics = {
  // Timer lifecycle (EVT-01)
  timerStarted(props: { project_id?: string | null; is_billable: boolean }) {
    track('timer_started', props)
  },

  timerPaused(props: { duration_seconds: number }) {
    track('timer_paused', props)
  },

  timerResumed(props: { duration_seconds: number }) {
    track('timer_resumed', props)
  },

  timerStopped(props: {
    timer_id?: string
    duration_seconds: number
    project_id?: string | null
    is_billable: boolean
    description_length: number
  }) {
    track('timer_stopped', props)
  },

  timerDiscarded(props: { duration_seconds: number }) {
    track('timer_discarded', props)
  },

  // Invoice lifecycle (EVT-02)
  invoiceCreated(props: {
    invoice_id: string
    client_id: string
    amount: number
    currency: string
    line_item_count: number
  }) {
    track('invoice_created', props)
  },

  invoiceSent(props: { invoice_id: string; amount: number; currency: string }) {
    track('invoice_sent', props)
  },

  invoiceViewed(props: { invoice_id: string }) {
    track('invoice_viewed', props)
  },

  invoiceMarkedPaid(props: { invoice_id: string; amount: number; currency: string }) {
    track('invoice_marked_paid', props)
  },

  invoiceVoided(props: { invoice_id: string }) {
    track('invoice_voided', props)
  },

  // Billing events (EVT-03)
  checkoutStarted(props: { tier: 'pro' | 'business' }) {
    track('checkout_started', props)
  },

  subscriptionActivated(props: { tier: 'pro' | 'business' }) {
    track('subscription_activated', props)
  },

  planChanged(props: { from_tier: string; to_tier: string }) {
    track('plan_changed', props)
  },

  subscriptionCancelled(props: { tier: string }) {
    track('subscription_cancelled', props)
  },

  // CRUD events (EVT-04)
  clientCreated() {
    track('client_created')
  },

  clientEdited(props: { client_id: string }) {
    track('client_edited', props)
  },

  clientDeleted(props: { client_id: string }) {
    track('client_deleted', props)
  },

  projectCreated(props: { project_id: string; client_id?: string | null }) {
    track('project_created', props)
  },

  projectEdited(props: { project_id: string }) {
    track('project_edited', props)
  },

  projectArchived(props: { project_id: string }) {
    track('project_archived', props)
  },

  timeEntryCreated(props: {
    entry_id: string
    duration_seconds: number
    is_billable: boolean
  }) {
    track('time_entry_created', props)
  },

  timeEntryEdited(props: { entry_id: string }) {
    track('time_entry_edited', props)
  },

  timeEntryDeleted(props: { entry_id: string }) {
    track('time_entry_deleted', props)
  },

  // Signup event
  signupCompleted() {
    track('signup_completed')
  },
}
