# Requirements: BillMint Observability & Analytics

**Defined:** 2026-02-11
**Core Value:** When something breaks in production, find the root cause fast through structured logs — and understand how users actually use the product through analytics.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Logging Foundation

- [x] **LOG-01**: All backend logs use structured JSON format with consistent schema (level, message, service, timestamp, context)
- [x] **LOG-02**: Logging is active in production only — development falls back to console
- [x] **LOG-03**: Every API request generates a correlation ID propagated through all downstream logs
- [x] **LOG-04**: All API routes log request method, path, status code, and response time
- [x] **LOG-05**: All errors include stack traces, error classification, and relevant context

### Console Migration

- [x] **MIG-01**: All console.error calls in service files are replaced with structured Axiom logger
- [x] **MIG-02**: All console.log calls in service files are replaced with structured Axiom logger
- [x] **MIG-03**: Logger utility provides service-scoped convenience methods (e.g., logger.forService('billing'))

### Webhook & Cron Observability

- [x] **WH-01**: Stripe webhook events log full lifecycle: received, validated, processed, response sent
- [x] **WH-02**: Webhook logging is async (fire-and-forget) to avoid Stripe timeout issues
- [x] **CRON-01**: Cron jobs (timer auto-pause, email summaries) log execution start, duration, success/failure, and items processed

### Analytics Foundation

- [ ] **ANA-01**: PostHog provider is integrated in the app layout with anonymous-only tracking
- [ ] **ANA-02**: Page views are tracked automatically on route changes
- [ ] **ANA-03**: PostHog is active in production only — disabled in development
- [ ] **ANA-04**: No PII (email, name, user ID) is sent to PostHog

### Lifecycle Events

- [ ] **EVT-01**: Timer lifecycle events tracked: start, pause, resume, stop, discard
- [ ] **EVT-02**: Invoice lifecycle events tracked: create, send, view (public), mark paid, void
- [ ] **EVT-03**: Billing events tracked: checkout started, subscription activated, plan changed, subscription cancelled
- [ ] **EVT-04**: CRUD events tracked: client created/edited/deleted, project created/edited/archived, time entry created/edited/deleted
- [ ] **EVT-05**: Funnel-ready events tracked: signup completed, first project created, first timer started, first invoice sent

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
| Feature flags via PostHog | Separate concern, not needed for observability milestone |
| Real-time alerting rules in code | Configure manually in Axiom dashboard after integration |
| OpenTelemetry distributed tracing | Overkill for monolith Next.js app — correlation IDs sufficient |
| Debug logs in production | Cost explosion risk — use INFO baseline |
| Custom dashboards in code | Ship events first, build dashboards manually after seeing patterns |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LOG-01 | Phase 1 | Done |
| LOG-02 | Phase 1 | Done |
| LOG-03 | Phase 1 | Done |
| LOG-04 | Phase 1 | Done |
| LOG-05 | Phase 1 | Done |
| MIG-01 | Phase 2 | Pending |
| MIG-02 | Phase 2 | Pending |
| MIG-03 | Phase 2 | Pending |
| WH-01 | Phase 2 | Pending |
| WH-02 | Phase 2 | Pending |
| CRON-01 | Phase 2 | Pending |
| ANA-01 | Phase 3 | Pending |
| ANA-02 | Phase 3 | Pending |
| ANA-03 | Phase 3 | Pending |
| ANA-04 | Phase 3 | Pending |
| EVT-01 | Phase 4 | Pending |
| EVT-02 | Phase 4 | Pending |
| EVT-03 | Phase 4 | Pending |
| EVT-04 | Phase 4 | Pending |
| EVT-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-02-11*
*Last updated: 2026-02-11 — Phase 1 requirements complete*
