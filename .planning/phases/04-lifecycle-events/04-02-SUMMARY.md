---
phase: 04-lifecycle-events
plan: 02
subsystem: analytics
tags: [invoice-tracking, billing-tracking, lifecycle-events, posthog]
dependency_graph:
  requires:
    - 04-01-SUMMARY.md (analytics event helpers for invoice and billing events)
    - 03-01-SUMMARY.md (PostHog provider and base tracking infrastructure)
  provides:
    - Invoice lifecycle event tracking from client-side API wrappers
    - Public invoice view tracking
    - Billing checkout funnel entry point tracking
  affects:
    - src/lib/api/invoices.ts (now tracks all invoice lifecycle events)
    - src/lib/api/billing.ts (now tracks checkout initiation)
    - src/app/invoice/[token]/page.tsx (now tracks public invoice views)
tech_stack:
  added: []
  patterns:
    - "Track-after-success pattern for API wrapper analytics"
    - "Fire-and-forget analytics calls (no await, no error handling)"
    - "Response data as source of truth for event properties"
key_files:
  created: []
  modified:
    - src/lib/api/invoices.ts
    - src/lib/api/billing.ts
    - src/app/invoice/[token]/page.tsx
decisions:
  - context: "Webhook-sourced billing events (subscription_activated, plan_changed, subscription_cancelled)"
    decision: "Document as requiring posthog-node for future implementation, only track checkout_started (client-side entry point) for now"
    rationale: "posthog-js is client-only, webhook handlers are server-side, requires posthog-node SDK to track from webhooks"
  - context: "When to fire analytics calls in API wrappers"
    decision: "Always after successful API response, never before, never on error"
    rationale: "Response data is source of truth, only track successful operations, prevents tracking phantom events from failed requests"
  - context: "What data to use for event properties"
    decision: "Use response data fields (not request parameters) wherever possible"
    rationale: "API response is authoritative, contains server-generated values like IDs and calculated totals"
metrics:
  duration: 3 min
  tasks_completed: 2
  files_modified: 3
  commits: 2
  deviations: 0
completed: 2026-02-11
---

# Phase 04 Plan 02: Invoice and Billing Lifecycle Event Tracking Summary

Invoice lifecycle events now fire from client-side API wrappers (create, send, mark paid, void), public invoice page (view), and billing checkout initiation.

## What Was Built

**Invoice Lifecycle Tracking (5 events):**
- `invoice_created` — Fires from `createInvoice()` with invoice_id, client_id, amount, currency, line_item_count
- `invoice_sent` — Fires from `sendInvoice()` with invoice_id, amount, currency
- `invoice_viewed` — Fires from public invoice page load with invoice_id
- `invoice_marked_paid` — Fires from `markInvoiceAsPaid()` with invoice_id, amount, currency
- `invoice_voided` — Fires from `voidInvoice()` with invoice_id

**Billing Tracking (1 event):**
- `checkout_started` — Fires from `createCheckoutSession()` with tier (pro/business)

**Implementation Pattern:**
All tracking follows the same pattern:
1. Call API via `fetcher()`
2. Capture result
3. Fire analytics event with data from response
4. Return result

If `fetcher` throws, analytics never fires (error path doesn't track).

## Verification Results

**TypeScript:** PASSED (no errors)
**Build:** PASSED (Next.js build succeeds)

**Coverage verification:**
- src/lib/api/invoices.ts: 4 analytics calls (created, sent, markedPaid, voided)
- src/app/invoice/[token]/page.tsx: 1 analytics call (viewed)
- src/lib/api/billing.ts: 1 analytics call (checkoutStarted)

All tracking fires after successful API response, uses response data for properties, and follows privacy rules (IDs and numbers only, no PII).

## Deviations from Plan

None - plan executed exactly as written.

## Key Decisions

**1. Webhook-sourced billing events deferred**
- **Context:** The event helpers `subscriptionActivated`, `planChanged`, and `subscriptionCancelled` exist but can't be called from webhook handlers
- **Decision:** Documented as requiring `posthog-node` for future implementation, only implemented `checkout_started` (client-side) for now
- **Rationale:** `posthog-js` is a browser-only SDK, Stripe webhooks are server-side. Would need to add `posthog-node` to track from webhook handlers.
- **Impact:** Billing funnel tracking covers checkout initiation but not subscription lifecycle (activation, changes, cancellation). These events are ready to use once `posthog-node` is added.

**2. Track after success, never on error**
- **Context:** When should analytics calls fire in API wrappers?
- **Decision:** Always after `await fetcher()` resolves successfully, before returning to caller
- **Rationale:** Only track operations that actually succeeded. If `fetcher` throws, the analytics call is never reached, preventing phantom events from failed requests.
- **Impact:** Analytics data reflects actual successful operations, not attempted operations.

**3. Response data as source of truth**
- **Context:** For properties like `amount` and `currency`, should we use request parameters or response data?
- **Decision:** Use response data wherever available (invoice has `total` and `currency` fields, use those)
- **Rationale:** API response is authoritative, contains server-generated IDs and server-calculated totals (important for invoices with tax/discount)
- **Impact:** Event properties reflect actual stored values, not client-submitted values.

## Commits

1. **5708a3b** - feat(04-02): add invoice lifecycle event tracking
   - Modified: src/lib/api/invoices.ts, src/app/invoice/[token]/page.tsx
   - Added tracking for invoice_created, invoice_sent, invoice_marked_paid, invoice_voided, invoice_viewed

2. **2f61a31** - feat(04-02): add billing checkout event tracking
   - Modified: src/lib/api/billing.ts
   - Added tracking for checkout_started
   - Documented webhook-sourced events requiring posthog-node

## Dependencies

**Depends on:**
- Plan 04-01 (Timer Lifecycle Event Tracking) - established event helper pattern
- Plan 03-01 (PostHog Anonymous Page View Tracking) - provided PostHog infrastructure and analytics module

**Enables:**
- Invoice funnel analysis (create → send → view → paid/void)
- Billing conversion tracking (checkout started → subscription activated)
- Revenue-generating action visibility

## Testing Notes

**Manual verification steps:**
1. Create an invoice → check PostHog for `invoice_created` event with correct properties
2. Send invoice → check for `invoice_sent` event
3. Open public invoice link → check for `invoice_viewed` event
4. Mark invoice paid → check for `invoice_marked_paid` event
5. Void an invoice → check for `invoice_voided` event
6. Start checkout flow → check for `checkout_started` event with tier

**Expected event flow for invoice lifecycle:**
```
invoice_created (user creates draft)
  ↓
invoice_sent (user sends to client)
  ↓
invoice_viewed (client opens link)
  ↓
invoice_marked_paid (user marks as paid)
  OR
invoice_voided (user voids invoice)
```

**Expected event flow for billing:**
```
checkout_started (user clicks upgrade button)
  ↓
[user completes Stripe checkout]
  ↓
subscription_activated (webhook fires - NOT YET TRACKED)
```

All events fire only in production (`isProduction` check in analytics module).

## Self-Check

Verifying all claimed work exists:

**Files modified:**
- src/lib/api/invoices.ts - FOUND
- src/lib/api/billing.ts - FOUND
- src/app/invoice/[token]/page.tsx - FOUND

**Commits:**
- 5708a3b (Task 1) - FOUND
- 2f61a31 (Task 2) - FOUND

**Analytics calls:**
- invoices.ts has 4 analytics calls (invoiceCreated, invoiceSent, invoiceMarkedPaid, invoiceVoided) - VERIFIED via grep
- page.tsx has 1 analytics call (invoiceViewed) - VERIFIED via grep
- billing.ts has 1 analytics call (checkoutStarted) - VERIFIED via grep

## Self-Check: PASSED
