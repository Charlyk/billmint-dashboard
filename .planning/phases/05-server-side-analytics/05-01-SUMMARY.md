---
phase: 05-server-side-analytics
plan: 01
subsystem: analytics
tags: [posthog, posthog-node, stripe-webhooks, server-side-tracking]

# Dependency graph
requires:
  - phase: 04-billing-analytics
    provides: Client-side PostHog config and billing event definitions
provides:
  - Server-side PostHog client for webhook tracking
  - Billing lifecycle event tracking from Stripe webhooks
  - Production-only gating with graceful shutdown
affects: [06-logging, future-server-events]

# Tech tracking
tech-stack:
  added: [posthog-node@5.24.15]
  patterns: [server-side analytics singleton, production-gated initialization, graceful shutdown handlers]

key-files:
  created:
    - src/lib/analytics/posthog-server.ts
  modified:
    - src/lib/services/billing.service.ts
    - package.json

key-decisions:
  - "flushAt: 1 and flushInterval: 0 for webhook events (low-volume, must not be lost)"
  - "Using customerId as distinctId for subscription.updated/deleted events (webhook limitation)"
  - "Silent no-op pattern for analytics failures (never break webhooks)"

patterns-established:
  - "Server-side analytics: lazy singleton with production gating and SIGTERM/SIGINT shutdown handlers"
  - "Webhook event tracking: fire after successful database operations, wrap in try/catch"
  - "Track-after-success pattern: analytics never blocks critical business operations"

# Metrics
duration: 2min
completed: 2026-02-11
---

# Phase 05 Plan 01: Server-Side Analytics Summary

**Stripe webhook billing events (subscription_activated, plan_changed, subscription_cancelled) tracked server-side via posthog-node with production gating and immediate flush**

## Performance

- **Duration:** 2 min 26 sec
- **Started:** 2026-02-11T20:57:41Z
- **Completed:** 2026-02-11T21:00:07Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Server-side PostHog client singleton with production-only initialization
- Graceful shutdown handlers (SIGTERM/SIGINT) to flush events on process exit
- 3 billing lifecycle events tracked from Stripe webhooks
- All tracking fires after successful database operations (never blocks business logic)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install posthog-node and create server-side PostHog client** - `bc778ab` (feat)
2. **Task 2: Add server-side billing event tracking to Stripe webhook handler** - `fca4845` (feat)

## Files Created/Modified
- `src/lib/analytics/posthog-server.ts` - Server-side PostHog singleton with production gating, graceful shutdown, and 3 typed event methods
- `src/lib/services/billing.service.ts` - Added serverAnalytics tracking to 3 webhook cases (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)
- `package.json` - Added posthog-node@5.24.15 dependency
- `package-lock.json` - Lock file update for posthog-node

## Decisions Made

**1. Immediate flush configuration for webhooks**
- Set `flushAt: 1` and `flushInterval: 0` on PostHog client
- Rationale: Webhook events are low-volume and critical - must not be lost if process terminates
- Trade-off: More network requests vs. data reliability (reliability wins for billing events)

**2. customerId as distinctId for subscription.updated/deleted**
- Stripe subscription webhooks don't include userId in payload, only customer ID
- Database RPC handles the mapping, but PostHog tracking uses customerId as distinctId
- Limitation documented in code comments
- Impact: Cross-referencing requires customer ID lookup

**3. Silent failure pattern for analytics**
- All serverAnalytics methods wrap capture() in try/catch with silent catch
- Rationale: Analytics should NEVER break webhooks or business operations
- Mirrors client-side analytics pattern (consistent error handling)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all dependencies available, TypeScript types correct, webhook structure known from existing code.

## User Setup Required

None - no external service configuration required.

PostHog configuration (NEXT_PUBLIC_POSTHOG_KEY, VERCEL_ENV) already exists from Phase 04. Server-side client reuses same credentials.

## Next Phase Readiness

Server-side analytics infrastructure complete. Ready for Phase 06 (Logging & Cleanup).

**What's ready:**
- Production-gated PostHog client for server-side events
- Billing lifecycle tracking implemented
- Pattern established for future server-side analytics

**No blockers identified.**

## Self-Check

Verifying all claimed files and commits exist:

```
✓ src/lib/analytics/posthog-server.ts - Created
✓ src/lib/services/billing.service.ts - Modified
✓ package.json - Modified
✓ Commit bc778ab - Found
✓ Commit fca4845 - Found
```

## Self-Check: PASSED

All files exist and all commits are in git history.

---
*Phase: 05-server-side-analytics*
*Completed: 2026-02-11*
