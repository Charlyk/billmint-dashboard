# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** When something breaks in production, find the root cause fast through structured logs — and understand how users actually use the product through analytics.
**Current focus:** Phase 3 - Analytics Foundation

## Current Position

Phase: 3 of 4 (Analytics Foundation)
Plan: 1 of 1 complete
Status: Complete
Last activity: 2026-02-11 — Completed 03-01 (PostHog Anonymous Page View Tracking)

Progress: [███████░░░] 75% (Phase 1 complete, Phase 2 complete, Phase 3 complete, 1 phase remaining)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 4 min
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-logging-foundation | 2/2 | 6 min | 3 min |
| 02-service-migration | 3/3 | 19 min | 6 min |
| 03-analytics-foundation | 1/1 | 2 min | 2 min |

**Recent Executions:**

| Phase | Plan | Duration | Tasks | Files |
|-------|------|----------|-------|-------|
| 01-logging-foundation | 02 | 3 min | 2 | 5 |
| 02-service-migration | 01 | 6 min | 2 | 2 |
| 02-service-migration | 02 | 7 min | 2 | 5 |
| 02-service-migration | 03 | 6 min | 3 | 8 |
| 03-analytics-foundation | 01 | 2 min | 2 | 5 |

**Recent Trend:**
- Last plan: 2 min (03-01)
- Trend: Fast analytics setup, previous phase averaged 6-7 min

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Axiom for backend, PostHog for frontend — Clear separation: server logs vs product analytics
- Replace all console.error with Axiom — Eliminate scattered logging, single source of truth
- Anonymous PostHog only — Privacy-first, no PII sent to third party
- Production only — Avoid polluting analytics/logs with dev data
- Track all key user actions — Timer, invoice, billing, CRUD — full product visibility
- Use VERCEL_ENV (not NODE_ENV) for production detection to match Vercel's environment model (Plan 01-01)
- Apply PII sanitization formatter only in production to avoid dev performance cost (Plan 01-01)
- Export withAxiom from logger.ts to centralize logging API surface (Plan 01-01)
- [Phase 01-logging-foundation]: Use AsyncLocalStorage for correlation ID propagation with x-correlation-id header fallback (Plan 01-02)
- [Phase 01-logging-foundation]: Route handler wrapper re-throws errors to preserve existing handleError pattern (Plan 01-02)
- [Phase 02-service-migration]: Include operation names in all invoice service logs for RPC debugging context
- [Phase 02-service-migration]: Include emailType in all email service logs for email flow visibility
- [Phase 02-service-migration]: Service-scoped loggers with operation context for RPC and storage errors
- [Phase 02-service-migration]: Webhook logging is fire-and-forget (no await) - Axiom transport is inherently async, keeps webhook response under Stripe's 5s timeout
- [Phase 02-service-migration]: Correlation ID fallback to crypto.randomUUID() for webhooks - Ensures every webhook gets unique ID even without AsyncLocalStorage context
- [Phase 02-service-migration]: Webhook processing wrapped in try/catch for failure logging - Logs failures before re-throwing for Stripe retry
- [Phase 02-service-migration]: Cron job logs in both service and route handler - Service logs operation details, route logs request lifecycle
- [Phase 03-analytics-foundation]: Use person_profiles: 'identified_only' for anonymous-only tracking - Prevents PostHog from creating user profiles, ensures zero PII exposure
- [Phase 03-analytics-foundation]: Position PHProvider outside Providers in root layout - PostHog tracks all pages including unauthenticated routes (landing, login, signup)
- [Phase 03-analytics-foundation]: Wrap PostHogPageView in Suspense boundary - useSearchParams requires Suspense to prevent hydration errors in Next.js App Router
- [Phase 03-analytics-foundation]: Set capture_pageview: false and implement manual tracking - PostHog auto-capture doesn't work correctly with App Router client-side navigation

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 1 (Logging Foundation):**
- Edge Runtime compatibility with Axiom @axiomhq/nextjs — limited production examples, may need edge-specific configuration
- PostHog reverse proxy with existing rate limiter — may conflict with middleware matchers, needs testing

**Phase 2 (Service Migration):**
- Supabase RPC logging integration — no documented patterns for trace ID propagation to database-side logs
- Webhook timeout risk — must implement fire-and-forget async logging to stay under 5s Stripe requirement

All blockers have documented mitigation strategies from research and don't prevent starting Phase 1.

## Session Continuity

Last session: 2026-02-11
Stopped at: Completed 03-01-PLAN.md (PostHog Anonymous Page View Tracking)
Resume file: None

---
*State initialized: 2026-02-11*
*Last updated: 2026-02-11T14:30:00Z*
