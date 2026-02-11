# Phase 4: Lifecycle Events - Research

**Researched:** 2026-02-11
**Domain:** PostHog custom event tracking for product lifecycle workflows
**Confidence:** HIGH

## Summary

PostHog custom event tracking enables comprehensive product visibility through `posthog.capture()` calls placed at critical lifecycle points in your application. Unlike pageview tracking (Phase 3), lifecycle events require deliberate instrumentation: identifying the exact moment to track (e.g., when timer stops vs. when API call succeeds), choosing between client-side and server-side tracking, and designing a consistent event taxonomy that supports funnel analysis months later.

The core pattern is simple: `posthog.capture('event_name', { property: value })`. The complexity lies in architecture—where to place tracking calls (React components vs. service layer), how to handle async operations without blocking UX, and ensuring privacy-first tracking (IDs only, never PII). BillMint's existing service layer architecture (`src/lib/services/*.service.ts`) provides natural injection points: timer lifecycle events in `timer.service.ts`, invoice events in `invoice.service.ts`, and CRUD events in respective services.

Event naming conventions matter significantly. Industry standard is **object-action** naming (past tense verbs): `timer_started`, `invoice_created`, `subscription_activated`. Properties provide context: `{ duration_seconds: 3600, project_id: 'proj_123' }`. This structure enables PostHog's funnel analysis to answer questions like "Of users who started their first timer, how many created their first invoice?" without additional instrumentation.

**Primary recommendation:** Create centralized analytics module (`src/lib/analytics/events.ts`) with typed event helpers that wrap `posthog.capture()`, inject tracking calls in existing service layer functions (server-side for reliability), use object-action naming with snake_case, track properties as IDs/numbers/enums (never PII), and leverage existing production-only gating from Phase 3.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| posthog-js | 1.345.4 (installed) | Event capture SDK | Already integrated in Phase 3, supports both client and server-side capture |
| Next.js | 16.1.4 | App Router framework | Service layer provides natural tracking injection points |
| React | 19.2.3 | Client-side framework | usePostHog hook for UI-triggered events |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | ^5 | Type safety for events | Define event schemas to prevent property typos |
| Zod | ^4.3.5 (installed) | Runtime validation | Optional: validate event properties before sending |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server-side tracking | Client-side only | Client: simpler but less reliable (ad-blockers, network failures), Server: more reliable but requires async handling |
| Centralized helpers | Inline posthog.capture() | Centralized: type-safe and consistent, Inline: faster to implement but harder to maintain |
| Service layer injection | Component-level tracking | Service layer: captures all paths (API routes, server actions), Components: only captures UI interactions |

**Installation:**
No additional packages required. PostHog already installed in Phase 3.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── analytics/
│   │   ├── posthog.ts           # Existing: config, isProduction check
│   │   ├── events.ts            # NEW: Typed event tracking helpers
│   │   └── types.ts             # NEW: Event property type definitions
│   └── services/
│       ├── timer.service.ts     # MODIFY: Add timer lifecycle tracking
│       ├── invoice.service.ts   # MODIFY: Add invoice lifecycle tracking
│       ├── billing.service.ts   # MODIFY: Add billing event tracking
│       ├── client.service.ts    # MODIFY: Add client CRUD tracking
│       ├── project.service.ts   # MODIFY: Add project CRUD tracking
│       └── time-entry.service.ts # MODIFY: Add time entry CRUD tracking
├── contexts/
│   └── timer-context.tsx        # MODIFY: Track timer events from client state
```

### Pattern 1: Centralized Event Helpers (Recommended)
**What:** Single source of truth for all event tracking with TypeScript types
**When to use:** Required for type safety, consistency, and preventing typos
**Example:**
```typescript
// src/lib/analytics/events.ts
import posthog from 'posthog-js'
import { isProduction } from './posthog'

// Event property types
type TimerLifecycleProps = {
  timer_id?: string
  duration_seconds: number
  project_id?: string | null
  is_billable: boolean
  description_length: number  // Length, not actual description (no PII)
}

type InvoiceLifecycleProps = {
  invoice_id: string
  client_id: string
  amount: number
  currency: string
  line_item_count: number
}

// Centralized tracking function with environment check
function track(eventName: string, properties?: Record<string, unknown>) {
  if (!isProduction) return

  try {
    posthog.capture(eventName, properties)
  } catch (error) {
    // Silent fail - never break app for analytics
    console.error('Analytics error:', error)
  }
}

// Type-safe event tracking API
export const analytics = {
  // Timer lifecycle events
  timerStarted: (props: Pick<TimerLifecycleProps, 'project_id' | 'is_billable'>) => {
    track('timer_started', props)
  },

  timerPaused: (props: Pick<TimerLifecycleProps, 'duration_seconds'>) => {
    track('timer_paused', props)
  },

  timerResumed: (props: Pick<TimerLifecycleProps, 'duration_seconds'>) => {
    track('timer_resumed', props)
  },

  timerStopped: (props: TimerLifecycleProps) => {
    track('timer_stopped', props)
  },

  timerDiscarded: (props: Pick<TimerLifecycleProps, 'duration_seconds'>) => {
    track('timer_discarded', props)
  },

  // Invoice lifecycle events
  invoiceCreated: (props: InvoiceLifecycleProps) => {
    track('invoice_created', props)
  },

  invoiceSent: (props: Pick<InvoiceLifecycleProps, 'invoice_id' | 'amount'>) => {
    track('invoice_sent', props)
  },

  invoiceViewed: (props: Pick<InvoiceLifecycleProps, 'invoice_id'>) => {
    track('invoice_viewed', props)
  },

  invoiceMarkedPaid: (props: Pick<InvoiceLifecycleProps, 'invoice_id' | 'amount'>) => {
    track('invoice_marked_paid', props)
  },

  invoiceVoided: (props: Pick<InvoiceLifecycleProps, 'invoice_id'>) => {
    track('invoice_voided', props)
  },

  // Billing events
  checkoutStarted: (props: { tier: 'pro' | 'business' }) => {
    track('checkout_started', props)
  },

  subscriptionActivated: (props: { tier: 'pro' | 'business' }) => {
    track('subscription_activated', props)
  },

  planChanged: (props: { from_tier: string; to_tier: string }) => {
    track('plan_changed', props)
  },

  subscriptionCancelled: (props: { tier: string; reason?: string }) => {
    track('subscription_cancelled', props)
  },

  // CRUD events
  clientCreated: () => {
    track('client_created')
  },

  clientEdited: (props: { client_id: string }) => {
    track('client_edited', props)
  },

  clientDeleted: (props: { client_id: string }) => {
    track('client_deleted', props)
  },

  projectCreated: (props: { project_id: string; client_id?: string | null }) => {
    track('project_created', props)
  },

  projectEdited: (props: { project_id: string }) => {
    track('project_edited', props)
  },

  projectArchived: (props: { project_id: string }) => {
    track('project_archived', props)
  },

  timeEntryCreated: (props: { entry_id: string; duration_seconds: number; is_billable: boolean }) => {
    track('time_entry_created', props)
  },

  timeEntryEdited: (props: { entry_id: string }) => {
    track('time_entry_edited', props)
  },

  timeEntryDeleted: (props: { entry_id: string }) => {
    track('time_entry_deleted', props)
  },

  // Funnel-ready events (onboarding milestones)
  signupCompleted: () => {
    track('signup_completed')
  },

  firstProjectCreated: () => {
    track('first_project_created')
  },

  firstTimerStarted: () => {
    track('first_timer_started')
  },

  firstInvoiceSent: () => {
    track('first_invoice_sent')
  },
}
```
**Source:** Based on patterns from [PostHog Custom Events & Autocapture Events](https://visionlabs.com/academy/posthog/events/) and [PostHog in Practice: How to Build Data Pipelines](https://bix-tech.com/posthog-in-practice-how-to-build-data-pipelines-and-unlock-user-behavior-analytics/)

### Pattern 2: Service Layer Injection (Server-Side)
**What:** Add tracking calls to existing service functions for reliability
**When to use:** For all server-side actions (CRUD, lifecycle events, billing)
**Example:**
```typescript
// src/lib/services/timer.service.ts
import { analytics } from '@/lib/analytics/events'

export async function stopTimer(): Promise<{ timeEntry: TimeEntry }> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data, error } = await (supabase.rpc as any)('stop_timer', {
    p_user_id: currentUser.id,
  })

  if (error) {
    // Error handling...
    throw new ValidationError('Failed to stop timer')
  }

  if (!data) {
    throw new ValidationError('Failed to stop timer')
  }

  // Track event AFTER successful operation
  analytics.timerStopped({
    timer_id: data.timeEntry.id,
    duration_seconds: data.timeEntry.duration_seconds,
    project_id: data.timeEntry.project_id,
    is_billable: data.timeEntry.is_billable,
    description_length: data.timeEntry.description?.length || 0,
  })

  return data
}
```
**Why server-side:** Guaranteed execution (no ad-blockers), captures all paths (API routes, server actions, direct DB operations), no hydration issues, can include server-side context (latency, errors).

**Source:** [How to create backend events with PostHog](https://blog.skorpen.com/how-to-create-backend-events-with-posthog)

### Pattern 3: Client-Side Tracking for UI Events
**What:** Use `usePostHog()` hook for events that don't go through service layer
**When to use:** For pure UI interactions (modal opened, tab switched) where no API call exists
**Example:**
```typescript
// src/contexts/timer-context.tsx
import { usePostHog } from 'posthog-js/react'

export function TimerProvider({ children }: TimerProviderProps) {
  const posthog = usePostHog()

  const discardTimer = useCallback(async () => {
    // ... existing logic ...

    try {
      await timerApi.discardTimer()

      // Client-side tracking for discard (service layer has no return value)
      if (posthog) {
        posthog.capture('timer_discarded', {
          duration_seconds: displayTime,
        })
      }

      toastManager.add({ type: 'info', title: 'Timer discarded' })
    } catch {
      // Error handling...
    }
  }, [posthog, displayTime])
}
```
**Source:** [Using PostHog with the Next.js App Router and Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics)

### Pattern 4: Funnel-Ready "First Time" Events
**What:** Track milestone events to measure onboarding funnel completion
**When to use:** For key onboarding moments (first project, first timer, first invoice)
**Example:**
```typescript
// src/lib/services/project.service.ts
export async function createProject(input: { name: string; ... }): Promise<Project> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data, error } = await (supabase.rpc as any)('create_project', {
    p_user_id: currentUser.id,
    // ... params
  })

  if (error || !data) {
    throw new ValidationError('Failed to create project')
  }

  // Regular CRUD event
  analytics.projectCreated({
    project_id: data.id,
    client_id: data.client_id,
  })

  // Check if this is user's first project for funnel tracking
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)

  if (count === 1) {
    analytics.firstProjectCreated()
  }

  return data
}
```
**Why separate events:** Allows funnel analysis (`signup_completed` → `first_project_created` → `first_timer_started` → `first_invoice_sent`) without filtering all project_created events by count.

**Source:** [How to Create and Analyze Funnels in PostHog](https://visionlabs.com/academy/posthog/funnels/) and [GitHub - first-time-event-tracker](https://github.com/PostHog/first-time-event-tracker)

### Anti-Patterns to Avoid
- **Blocking user experience for analytics:** Always track asynchronously, catch errors silently, never throw
- **Including PII in properties:** Use IDs only (`client_id`, not `client_name` or `client_email`)
- **Tracking description text:** Track `description_length` as number, not actual description content
- **Inconsistent naming:** Mixing camelCase/snake_case or present/past tense breaks funnel analysis
- **Tracking before validation:** Only track after successful operation (after DB write, not before)
- **Client-side only tracking:** Ad-blockers will create data gaps for critical business events

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event deduplication | Custom event ID system | PostHog built-in | PostHog automatically handles duplicate events within 60 seconds using event fingerprints |
| First-time detection | Custom flags in DB | PostHog cohorts + filters | PostHog can filter events by "first time user did X" without DB schema changes |
| Event validation | Runtime type checking | TypeScript + typed helpers | Compile-time safety prevents most property errors, runtime validation adds overhead |
| Funnel analysis | Custom SQL queries | PostHog Funnels UI | PostHog provides visual funnel builder, time-to-convert analysis, and drop-off insights |
| Event queuing | Custom queue system | PostHog batch sending | PostHog SDK batches events automatically, handles retries, and manages network failures |

**Key insight:** Product analytics infrastructure has solved problems: event ordering, late-arriving events, session stitching, cross-device tracking, and privacy compliance. PostHog's SDK handles all edge cases that custom solutions miss.

## Common Pitfalls

### Pitfall 1: Tracking Too Early in the Call Stack
**What goes wrong:** Event fires before database write completes, then DB operation fails, creating phantom events
**Why it happens:** Natural instinct to track "when button clicked" rather than "when operation succeeded"
**How to avoid:**
1. Always track AFTER successful database operation (after `data` exists, not before)
2. Place tracking calls after error handling, in the success path only
3. For async operations, track after `await` completes successfully
**Warning signs:** Event counts higher than database record counts, events with IDs that don't exist in DB

### Pitfall 2: Accidentally Leaking PII
**What goes wrong:** Sending `{ client_name: "John Doe", email: "john@example.com" }` to PostHog violates privacy requirements
**Why it happens:** Copy-pasting object properties without sanitizing
**How to avoid:**
1. Never spread entire objects: `analytics.clientCreated({ ...client })` ❌
2. Explicitly pick properties: `analytics.clientCreated({ client_id: client.id })` ✅
3. Track counts/lengths instead of text: `description_length` not `description`
4. Document PII rules in event helper comments
**Warning signs:** PostHog dashboard shows names/emails in event properties, GDPR concerns raised

### Pitfall 3: Inconsistent Event Naming
**What goes wrong:** Dashboard has `timer_start`, `TimerStarted`, `start_timer`, `timer-started` for same event
**Why it happens:** Multiple developers without naming convention, mixing client/server conventions
**How to avoid:**
1. Document naming convention: `object_action` format, past tense, snake_case
2. Use centralized event helpers (prevents inline string typos)
3. Code review all new events against convention
4. Use TypeScript enums for event names if needed
**Warning signs:** Can't find events in PostHog search, funnel analysis has duplicate entries, dashboard looks messy

### Pitfall 4: Blocking UX with Analytics
**What goes wrong:** User clicks "stop timer", waits 2 seconds for analytics call to complete before UI updates
**Why it happens:** `await posthog.capture()` in critical path, or error from PostHog breaks operation
**How to avoid:**
1. Never await analytics calls: `analytics.timerStopped(...)` not `await analytics.timerStopped(...)`
2. Wrap all tracking in try-catch (silent fail)
3. Track after UI update in client-side code
4. Server-side: track after response sent (fire-and-forget)
**Warning signs:** Users report slow UI, analytics failures break features, network tab shows sequential requests

### Pitfall 5: Missing "First Time" Funnel Events
**What goes wrong:** Can't measure onboarding conversion because no milestone events tracked
**Why it happens:** Only tracking CRUD events, not identifying which actions represent progress
**How to avoid:**
1. Define onboarding funnel upfront: signup → first project → first timer → first invoice
2. Track separate `first_*` events for funnel analysis
3. Use count queries or PostHog cohorts to detect "first time"
4. Add funnel events retroactively if needed (PostHog can reprocess)
**Warning signs:** Can't answer "how many users complete onboarding?", no conversion metrics in dashboard

### Pitfall 6: Development Data Polluting Production Analytics
**What goes wrong:** Local dev events show up in PostHog, skewing metrics with test data
**Why it happens:** Forgot to check `isProduction` before tracking
**How to avoid:**
1. Reuse existing `isProduction` check from Phase 3 (`VERCEL_ENV === 'production'`)
2. Centralized tracking function checks environment once
3. Test events in staging environment, not production
4. Add "environment" property to all events for filtering (optional)
**Warning signs:** Localhost URLs in events, test data in production dashboard, metrics don't match reality

**Note:** Phase 3 already solved this with production-only initialization. Event helpers inherit this behavior.

## Code Examples

Verified patterns from best practices and existing codebase:

### Complete Event Tracking Module
```typescript
// src/lib/analytics/events.ts
import posthog from 'posthog-js'
import { isProduction } from './posthog'

/**
 * Centralized event tracking with type safety and environment gating.
 * Production-only tracking (inherited from Phase 3).
 *
 * Privacy rules:
 * - Use IDs only (client_id, project_id, invoice_id)
 * - Track counts/lengths, not actual content (description_length, not description)
 * - Never include PII (names, emails, addresses)
 */

// Shared helper for all tracking
function track(eventName: string, properties?: Record<string, unknown>) {
  // Production-only check (from Phase 3)
  if (!isProduction) {
    return
  }

  try {
    // Silent fail - never break app for analytics
    posthog.capture(eventName, properties)
  } catch (error) {
    console.error('Analytics tracking error:', error)
  }
}

// Export typed API
export const analytics = {
  // Timer lifecycle (EVT-01)
  timerStarted: (props: { project_id?: string | null; is_billable: boolean }) => {
    track('timer_started', props)
  },
  timerPaused: (props: { duration_seconds: number }) => {
    track('timer_paused', props)
  },
  timerResumed: (props: { duration_seconds: number }) => {
    track('timer_resumed', props)
  },
  timerStopped: (props: {
    timer_id?: string
    duration_seconds: number
    project_id?: string | null
    is_billable: boolean
    description_length: number
  }) => {
    track('timer_stopped', props)
  },
  timerDiscarded: (props: { duration_seconds: number }) => {
    track('timer_discarded', props)
  },

  // Invoice lifecycle (EVT-02)
  invoiceCreated: (props: {
    invoice_id: string
    client_id: string
    amount: number
    currency: string
    line_item_count: number
  }) => {
    track('invoice_created', props)
  },
  invoiceSent: (props: { invoice_id: string; amount: number; currency: string }) => {
    track('invoice_sent', props)
  },
  invoiceViewed: (props: { invoice_id: string }) => {
    track('invoice_viewed', props)
  },
  invoiceMarkedPaid: (props: { invoice_id: string; amount: number; currency: string }) => {
    track('invoice_marked_paid', props)
  },
  invoiceVoided: (props: { invoice_id: string }) => {
    track('invoice_voided', props)
  },

  // Billing events (EVT-03)
  checkoutStarted: (props: { tier: 'pro' | 'business' }) => {
    track('checkout_started', props)
  },
  subscriptionActivated: (props: { tier: 'pro' | 'business' }) => {
    track('subscription_activated', props)
  },
  planChanged: (props: { from_tier: string; to_tier: string }) => {
    track('plan_changed', props)
  },
  subscriptionCancelled: (props: { tier: string }) => {
    track('subscription_cancelled', props)
  },

  // CRUD events (EVT-04)
  clientCreated: () => track('client_created'),
  clientEdited: (props: { client_id: string }) => track('client_edited', props),
  clientDeleted: (props: { client_id: string }) => track('client_deleted', props),

  projectCreated: (props: { project_id: string; client_id?: string | null }) => {
    track('project_created', props)
  },
  projectEdited: (props: { project_id: string }) => track('project_edited', props),
  projectArchived: (props: { project_id: string }) => track('project_archived', props),

  timeEntryCreated: (props: {
    entry_id: string
    duration_seconds: number
    is_billable: boolean
  }) => {
    track('time_entry_created', props)
  },
  timeEntryEdited: (props: { entry_id: string }) => track('time_entry_edited', props),
  timeEntryDeleted: (props: { entry_id: string }) => track('time_entry_deleted', props),

  // Funnel-ready events (EVT-05)
  signupCompleted: () => track('signup_completed'),
  firstProjectCreated: () => track('first_project_created'),
  firstTimerStarted: () => track('first_timer_started'),
  firstInvoiceSent: () => track('first_invoice_sent'),
}
```

### Service Layer Integration Example
```typescript
// src/lib/services/invoice.service.ts
import { analytics } from '@/lib/analytics/events'

export async function createInvoice(input: { ... }): Promise<InvoiceWithDetails> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Create invoice
  const { data, error } = await (supabase.rpc as any)('create_invoice', {
    p_user_id: currentUser.id,
    // ... params
  })

  if (error || !data) {
    throw new ValidationError('Failed to create invoice')
  }

  // Track AFTER successful creation
  analytics.invoiceCreated({
    invoice_id: data.id,
    client_id: data.client_id,
    amount: data.total,
    currency: data.currency,
    line_item_count: data.line_items.length,
  })

  return data
}

export async function sendInvoice(id: string): Promise<Invoice> {
  // ... existing email sending logic ...

  // Track AFTER email sent successfully
  analytics.invoiceSent({
    invoice_id: updatedInvoice.id,
    amount: updatedInvoice.total,
    currency: updatedInvoice.currency,
  })

  return updatedInvoice
}
```

### Public Invoice View Tracking (Anonymous)
```typescript
// src/app/invoice/[token]/page.tsx (server component)
import { analytics } from '@/lib/analytics/events'

export default async function InvoicePage({ params }: { params: { token: string } }) {
  const invoice = await getPublicInvoice(params.token)

  // Track anonymous invoice view (no user context needed)
  analytics.invoiceViewed({
    invoice_id: invoice.id,
  })

  return <InvoiceDisplay invoice={invoice} />
}
```

### Billing Webhook Integration
```typescript
// src/lib/services/billing.service.ts
export async function handleWebhook(body: string, signature: string): Promise<void> {
  // ... existing webhook validation ...

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tier = session.metadata?.tier as 'pro' | 'business'

      if (userId && tier) {
        // Update database
        await supabase.rpc('handle_stripe_webhook', { ... })

        // Track successful checkout
        analytics.checkoutStarted({ tier })
        analytics.subscriptionActivated({ tier })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      // Track cancellation
      analytics.subscriptionCancelled({
        tier: 'pro', // Get from DB lookup if needed
      })
      break
    }
  }
}
```

### First-Time Funnel Event Example
```typescript
// src/lib/services/timer.service.ts
export async function startTimer(input: { ... }): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('start_timer', { ... })

  if (error || !data) {
    throw new ValidationError('Failed to start timer')
  }

  // Regular timer event
  analytics.timerStarted({
    project_id: data.timer.project_id,
    is_billable: data.timer.is_billable,
  })

  // Check if this is user's first timer for funnel tracking
  const { count } = await supabase
    .from('time_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)

  if (count === 0) {
    // No time entries yet = first timer
    analytics.firstTimerStarted()
  }

  return data
}
```

## Event Taxonomy

### Event Naming Convention
- **Format:** `object_action` (past tense, snake_case)
- **Examples:** `timer_started`, `invoice_created`, `subscription_activated`
- **Rationale:** Consistent with industry standards, easy to search, supports funnel analysis

### Property Naming Convention
- **Format:** snake_case
- **Types:** IDs (string), numbers (duration, amount), enums (tier, currency), booleans (is_billable)
- **Privacy:** Never include PII (names, emails, addresses, phone numbers)

### Complete Event List (31 events across 5 requirements)

**EVT-01: Timer Lifecycle (5 events)**
1. `timer_started` - `{ project_id?, is_billable }`
2. `timer_paused` - `{ duration_seconds }`
3. `timer_resumed` - `{ duration_seconds }`
4. `timer_stopped` - `{ timer_id?, duration_seconds, project_id?, is_billable, description_length }`
5. `timer_discarded` - `{ duration_seconds }`

**EVT-02: Invoice Lifecycle (5 events)**
6. `invoice_created` - `{ invoice_id, client_id, amount, currency, line_item_count }`
7. `invoice_sent` - `{ invoice_id, amount, currency }`
8. `invoice_viewed` - `{ invoice_id }` (anonymous, public view)
9. `invoice_marked_paid` - `{ invoice_id, amount, currency }`
10. `invoice_voided` - `{ invoice_id }`

**EVT-03: Billing Events (4 events)**
11. `checkout_started` - `{ tier }`
12. `subscription_activated` - `{ tier }`
13. `plan_changed` - `{ from_tier, to_tier }`
14. `subscription_cancelled` - `{ tier }`

**EVT-04: CRUD Events (13 events)**
15. `client_created` - no props
16. `client_edited` - `{ client_id }`
17. `client_deleted` - `{ client_id }`
18. `project_created` - `{ project_id, client_id? }`
19. `project_edited` - `{ project_id }`
20. `project_archived` - `{ project_id }`
21. `time_entry_created` - `{ entry_id, duration_seconds, is_billable }`
22. `time_entry_edited` - `{ entry_id }`
23. `time_entry_deleted` - `{ entry_id }`

**EVT-05: Funnel-Ready Events (4 events)**
24. `signup_completed` - no props
25. `first_project_created` - no props
26. `first_timer_started` - no props
27. `first_invoice_sent` - no props

**Additional Context Events (optional future)**
28. `invoice_reminder_sent` - `{ invoice_id }`
29. `client_archived` - `{ client_id }`
30. `project_unarchived` - `{ project_id }`
31. `time_entries_bulk_updated` - `{ count }`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mixpanel/Amplitude | PostHog (open source) | 2023-2024 | Privacy-first option, self-hostable, lower cost for high volume |
| Client-side only | Hybrid (server + client) | 2024+ | More reliable tracking, captures API/webhook events, ad-blocker resistant |
| String event names | Typed helpers | TypeScript era | Type safety prevents typos, autocomplete improves DX |
| `person_profiles: 'always'` | `person_profiles: 'identified_only'` | PostHog v3 (2024) | Anonymous-first tracking without creating profiles |
| Manual funnel queries | PostHog Funnels UI | PostHog 2.0+ (2023) | Visual funnel builder, time-to-convert, drop-off analysis built-in |

**Deprecated/outdated:**
- **Track everything everywhere:** Modern approach is intentional tracking of business-critical events only
- **Client-side only tracking:** Server-side now standard for reliability and completeness
- **Unstructured properties:** Typed schemas and validation now expected
- **Separate analytics vs. product databases:** Modern tools (PostHog) integrate both

**Recent additions (2025-2026):**
- **First-time event detection:** PostHog added native support for "first time user did X" filters
- **Lifecycle analysis:** Built-in lifecycle cohorts (new, returning, resurrecting, dormant)
- **Anonymous session replay:** Can now replay sessions without user profiles (privacy-first)

## Open Questions

1. **Where to track signup_completed event?**
   - What we know: Signup happens in auth flow, likely in `auth.service.ts`
   - What's unclear: Whether signup uses Supabase Auth directly or custom flow
   - Recommendation: Inspect auth implementation, track in `auth.service.ts` after user creation

2. **How to handle bulk operations (e.g., bulk delete time entries)?**
   - What we know: `time-entry.service.ts` has `bulkDeleteTimeEntries()` function
   - What's unclear: Track one event with count, or individual events per entry?
   - Recommendation: Track single event with `{ count: number, entry_ids: string[] }` for performance

3. **Should we track invoice updates/edits?**
   - What we know: Requirements don't explicitly mention invoice edit tracking
   - What's unclear: Is this useful for product analytics or too noisy?
   - Recommendation: Start without, add later if needed (PostHog can backfill)

4. **Track timer auto-pause events?**
   - What we know: Timer auto-pauses after X hours (seen in timer.service.ts)
   - What's unclear: Is this a lifecycle event worth tracking?
   - Recommendation: Track as `timer_auto_paused` with duration for visibility into this edge case

5. **How to identify "first time" actions reliably?**
   - What we know: Can query database count or use PostHog cohorts
   - What's unclear: Race conditions if multiple requests happen simultaneously
   - Recommendation: Use database count in service layer (authoritative), not PostHog filters

## Sources

### Primary (HIGH confidence)
- [PostHog Custom Events & Autocapture Events](https://visionlabs.com/academy/posthog/events/) - Event types and implementation patterns
- [PostHog in Practice: How to Build Data Pipelines](https://bix-tech.com/posthog-in-practice-how-to-build-data-pipelines-and-unlock-user-behavior-analytics/) - Privacy-first patterns and data architecture
- [Simple Event Naming Conventions for Product Analytics](https://www.wudpecker.io/blog/simple-event-naming-conventions-for-product-analytics) - Industry-standard naming conventions
- [Using PostHog with the Next.js App Router and Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics) - Official Next.js integration guide
- [How to create backend events with PostHog](https://blog.skorpen.com/how-to-create-backend-events-with-posthog) - Server-side tracking patterns
- Existing codebase analysis: Phase 3 research, service layer architecture, timer/invoice/billing implementations

### Secondary (MEDIUM confidence)
- [How to Create and Analyze Funnels in PostHog](https://visionlabs.com/academy/posthog/funnels/) - Funnel analysis and onboarding tracking
- [GitHub - first-time-event-tracker](https://github.com/PostHog/first-time-event-tracker) - First-time event detection plugin
- [PostHog Demo (2026)](https://visionlabs.com/academy/posthog/demo/) - Recent feature overview
- [Best Practices for Event Tracking with PostHog](https://help-center.atlasbeta.so/posthog/articles/878323-best-practices-for-event-tracking-with-posthog) - General best practices

### Tertiary (LOW confidence - supplemental)
- Various GitHub issues on PostHog event management and taxonomy
- Community blog posts on analytics implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PostHog already installed, version confirmed, React/Next.js integration well-documented
- Architecture patterns: HIGH - Service layer injection points identified in codebase, typed helper pattern verified from multiple sources
- Event naming conventions: HIGH - Industry-standard object-action pattern confirmed across multiple authoritative sources
- Privacy requirements: HIGH - Anonymous-only tracking already implemented in Phase 3, requirements explicitly state "no PII"
- Server vs. client tracking: MEDIUM-HIGH - Best practices clear, but specific implementation in BillMint services requires verification during execution

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days - stable domain, PostHog patterns unlikely to change rapidly)

**Key uncertainties requiring validation during implementation:**
1. Exact location of signup completion handler for `signup_completed` event
2. Whether invoice edit tracking is desired (not in requirements but common pattern)
3. Optimal approach for detecting "first time" actions (DB count vs. PostHog cohorts)
4. Whether to track timer auto-pause as separate lifecycle event
