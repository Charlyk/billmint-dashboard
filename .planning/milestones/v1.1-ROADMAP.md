# Roadmap: BillMint

## Milestones

- ✅ **v1.0 Observability & Analytics** — Phases 1-4 (shipped 2026-02-11)
- 🚧 **v1.1 Observability Hardening** — Phases 5-6 (in progress)

## Phases

<details>
<summary>✅ v1.0 Observability & Analytics (Phases 1-4) — SHIPPED 2026-02-11</summary>

- [x] Phase 1: Logging Foundation (2/2 plans) — completed 2026-02-11
- [x] Phase 2: Service Migration (3/3 plans) — completed 2026-02-11
- [x] Phase 3: Analytics Foundation (1/1 plan) — completed 2026-02-11
- [x] Phase 4: Lifecycle Events (3/3 plans) — completed 2026-02-11

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Observability Hardening (In Progress)

**Milestone Goal:** Close v1.0 tech debt — server-side PostHog for webhook events, withLogging on all API routes, clean up unused funnel helpers.

#### Phase 5: Server-Side Analytics
**Goal**: Billing lifecycle events tracked server-side via posthog-node
**Depends on**: Phase 4 (event helpers already exist)
**Requirements**: SSA-01, SSA-02, SSA-03, SSA-04
**Success Criteria** (what must be TRUE):
  1. Stripe subscription_activated webhook fires subscription_activated event to PostHog
  2. Stripe plan change webhook fires plan_changed event to PostHog
  3. Stripe subscription cancellation webhook fires subscription_cancelled event to PostHog
  4. PostHog node client only initializes in production and shuts down gracefully
**Plans**: 1 plan

Plans:
- [x] 05-01-PLAN.md — Install posthog-node and track billing lifecycle events server-side — completed 2026-02-11

#### Phase 6: Logging & Cleanup
**Goal**: All API routes use withLogging wrapper and unused analytics code is removed
**Depends on**: Phase 5
**Requirements**: LOG-06, LOG-07, CLN-01, CLN-02
**Success Criteria** (what must be TRUE):
  1. Every API route handler uses withLogging wrapper for correlation ID propagation
  2. All API requests log method, path, status code, and response time
  3. Unused first_project_created, first_timer_started, first_invoice_sent helpers removed from events.ts
  4. PostHog "First time event" filter decision documented in PROJECT.md or inline comments
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Apply withLogging wrapper to all CRUD, business, and infrastructure API routes — completed 2026-02-11
- [x] 06-02-PLAN.md — Apply withLogging to auth routes and remove unused analytics first_* helpers — completed 2026-02-11

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Logging Foundation | v1.0 | 2/2 | ✓ Complete | 2026-02-11 |
| 2. Service Migration | v1.0 | 3/3 | ✓ Complete | 2026-02-11 |
| 3. Analytics Foundation | v1.0 | 1/1 | ✓ Complete | 2026-02-11 |
| 4. Lifecycle Events | v1.0 | 3/3 | ✓ Complete | 2026-02-11 |
| 5. Server-Side Analytics | v1.1 | 1/1 | ✓ Complete | 2026-02-11 |
| 6. Logging & Cleanup | v1.1 | 2/2 | ✓ Complete | 2026-02-11 |

---
*Roadmap created: 2026-02-11*
*Last updated: 2026-02-11 — Phase 6 complete, v1.1 milestone complete*
