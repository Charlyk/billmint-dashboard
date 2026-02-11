# Requirements: BillMint Observability Hardening

**Defined:** 2026-02-11
**Core Value:** When something breaks in production, find the root cause fast through structured logs — and understand how users actually use the product through analytics.

## v1.1 Requirements

Requirements for v1.1 release. Closes tech debt from v1.0.

### Server-Side Analytics

- [ ] **SSA-01**: Stripe webhook handler tracks `subscription_activated` event via posthog-node when a new subscription is created
- [ ] **SSA-02**: Stripe webhook handler tracks `plan_changed` event via posthog-node when a subscription plan is updated
- [ ] **SSA-03**: Stripe webhook handler tracks `subscription_cancelled` event via posthog-node when a subscription is cancelled
- [ ] **SSA-04**: posthog-node client is production-only and shuts down gracefully on process exit

### Request Logging

- [ ] **LOG-06**: All API route handlers use withLogging wrapper for correlation ID propagation and request lifecycle logging
- [ ] **LOG-07**: withLogging wrapper logs request method, path, status code, and response time for every API request

### Analytics Cleanup

- [ ] **CLN-01**: Unused `first_*` funnel event helpers are removed from `events.ts`
- [ ] **CLN-02**: PostHog "First time event" filter approach is documented as deliberate decision (not tech debt)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Observability

- **ADV-01**: Service-level context isolation with per-service namespaces for log querying
- **ADV-02**: Email delivery tracking (template, outcome, correlation with user actions)
- **ADV-03**: Performance metrics (P95/P99 latency per endpoint)
- **ADV-04**: Error classification system (client/server/validation/transient/fatal)
- **ADV-05**: Log sampling for high-volume endpoints to control costs

### Advanced Analytics

- **ADV-06**: Retention cohort analysis by signup week
- **ADV-07**: Feature usage heatmap across product areas
- **ADV-08**: Custom PostHog dashboards for key business metrics

## Out of Scope

| Feature | Reason |
|---------|--------|
| Session recording | Privacy concerns, storage costs, GDPR complexity |
| User identification in PostHog | Privacy-first constraint — anonymous only |
| Feature flags via PostHog | Separate concern, not needed for observability |
| Real-time alerting rules in code | Configure manually in Axiom dashboard |
| Custom PostHog dashboards in code | Ship events first, build dashboards manually |
| First-time funnel explicit events | PostHog "First time event" filter is equivalent and simpler |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SSA-01 | Phase 5 | Pending |
| SSA-02 | Phase 5 | Pending |
| SSA-03 | Phase 5 | Pending |
| SSA-04 | Phase 5 | Pending |
| LOG-06 | Phase 6 | Pending |
| LOG-07 | Phase 6 | Pending |
| CLN-01 | Phase 6 | Pending |
| CLN-02 | Phase 6 | Pending |

**Coverage:**
- v1.1 requirements: 8 total
- Mapped to phases: 8/8 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 — v1.1 roadmap created, 100% coverage*
