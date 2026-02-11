---
phase: 04-lifecycle-events
plan: 01
subsystem: analytics
tags:
  - analytics
  - events
  - timer
  - posthog
  - tracking
dependency_graph:
  requires:
    - 03-01 (PostHog initialization and pageview tracking)
  provides:
    - Typed analytics event helpers (27 events across 5 requirement groups)
    - Timer lifecycle event tracking (started, paused, resumed, stopped, discarded)
    - Browser-safe and production-gated tracking infrastructure
  affects:
    - src/contexts/timer-context.tsx (timer operations now emit analytics events)
tech_stack:
  added:
    - posthog-js capture() API for custom event tracking
  patterns:
    - Typed event helper pattern with privacy-first design (IDs only, no PII)
    - Fire-and-forget analytics (no await, never block user actions)
    - Silent no-op pattern (typeof window + isProduction checks)
key_files:
  created:
    - src/lib/analytics/events.ts (analytics module with 27 typed event helpers)
  modified:
    - src/contexts/timer-context.tsx (5 timer lifecycle tracking calls)
decisions: []
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_created: 1
  files_modified: 1
  commits: 2
  completed_at: "2026-02-11T20:10:00Z"
---

# Phase 04 Plan 01: Timer Lifecycle Event Tracking Summary

**One-liner:** Centralized typed analytics event tracking module with all 27 events and full timer lifecycle instrumentation.

## What Was Built

Created the analytics foundation for product intelligence:

1. **Analytics Events Module (`src/lib/analytics/events.ts`)**
   - 27 typed event helpers across 5 requirement groups
   - Browser-safe track() function with typeof window check
   - Production-only gating via isProduction check
   - Silent error handling - never breaks app for analytics
   - Privacy-first design: IDs only, counts/lengths, zero PII

2. **Timer Lifecycle Tracking**
   - timer_started: Tracks project_id and is_billable on successful start
   - timer_paused: Tracks duration_seconds on successful pause
   - timer_resumed: Tracks duration_seconds on successful resume
   - timer_stopped: Tracks full metadata (duration, project, billable, description_length)
   - timer_discarded: Tracks duration_seconds on successful discard
   - All tracking is fire-and-forget (no await), after API success, never in error paths

## Event Taxonomy

**Timer lifecycle (EVT-01) - 5 events:**
- timer_started, timer_paused, timer_resumed, timer_stopped, timer_discarded

**Invoice lifecycle (EVT-02) - 5 events:**
- invoice_created, invoice_sent, invoice_viewed, invoice_marked_paid, invoice_voided

**Billing events (EVT-03) - 4 events:**
- checkout_started, subscription_activated, plan_changed, subscription_cancelled

**CRUD events (EVT-04) - 9 events:**
- client_created, client_edited, client_deleted
- project_created, project_edited, project_archived
- time_entry_created, time_entry_edited, time_entry_deleted

**Funnel-ready events (EVT-05) - 4 events:**
- signup_completed, first_project_created, first_timer_started, first_invoice_sent

## Technical Implementation

**track() helper design:**
- Returns early if `typeof window === 'undefined'` (server-side safety)
- Returns early if `!isProduction` (environment gating)
- Wraps posthog.capture() in try-catch with silent error handling
- Never logs errors to console (Axiom is server-side only, console noise avoided in dev)

**Timer tracking integration:**
- All tracking calls placed AFTER successful API responses (inside try blocks)
- No tracking in error/catch paths
- Uses data already in scope (prevTimer, savedDuration, currentDisplayTime)
- No additional API calls for analytics properties
- Fire-and-forget pattern via posthog-js batching (no await)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:

- [x] TypeScript compilation passes (npx tsc --noEmit)
- [x] Next.js build succeeds (npm run build)
- [x] src/lib/analytics/events.ts exports analytics object with 27 typed methods
- [x] track() has typeof window and isProduction checks
- [x] timer-context.tsx imports analytics and has 5 tracking calls in success paths
- [x] No analytics tracking in error/catch paths
- [x] Event names match research taxonomy (timer_started, timer_paused, etc.)

## Self-Check: PASSED

**Files created:**
- FOUND: src/lib/analytics/events.ts

**Files modified:**
- FOUND: src/contexts/timer-context.tsx

**Commits:**
- FOUND: ee3367b (Task 1 - analytics events module)
- FOUND: 17a32ff (Task 2 - timer lifecycle tracking)

## Next Steps

Phase 04 Plan 02: Invoice and Billing Lifecycle Events
- Instrument invoice operations (create, send, view, mark paid, void)
- Instrument billing operations (checkout start, subscription activate, plan change, cancel)
- Instrument CRUD operations for clients, projects, time entries

Phase 04 Plan 03: Funnel Events and Onboarding Tracking
- Instrument signup_completed, first_project_created, first_timer_started, first_invoice_sent
- Complete Phase 4 lifecycle event coverage

## Impact

**Product intelligence foundation:**
- All 27 custom events now available for tracking across the app
- Timer workflow (most critical user flow) fully instrumented
- Privacy-first design prevents PII exposure to PostHog
- Production-only gating avoids polluting analytics with dev data
- Silent no-op pattern ensures analytics never breaks the app

**Developer experience:**
- TypeScript ensures correct event properties at compile time
- Centralized module provides single source of truth for event tracking
- Greppable event names (string literals, not enums)
- No runtime overhead (no Zod validation)

**Analytics capability:**
- Ready for PostHog dashboards, funnels, and insights
- Timer usage patterns now visible (start/pause/resume/stop/discard flows)
- Duration tracking enables time-on-task analysis
- Project and billable status enable segmentation by work type
