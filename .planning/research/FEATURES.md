# Feature Research

**Domain:** Observability & Analytics for Next.js SaaS
**Researched:** 2026-02-11
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features that production observability and analytics integrations must have. Missing these means the integration is incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Structured logging (JSON)** | Machine-parsable logs are foundational for any modern observability platform | LOW | Key-value pairs, consistent schema across all log entries |
| **Log levels (debug/info/warn/error)** | Standard practice for filtering and routing logs by severity | LOW | Maps to console methods, production defaults to INFO/WARN/ERROR |
| **Request/response logging** | Core API observability — capture method, path, status, latency for every request | MEDIUM | Middleware-level implementation, includes error responses |
| **Error tracking with stack traces** | Essential for debugging production issues, must include full context | LOW | Capture exception details, file/line numbers, error messages |
| **Environment filtering** | Production-only activation prevents dev/staging noise from polluting analytics | LOW | Single flag check based on NODE_ENV or VERCEL_ENV |
| **Page view tracking** | Baseline analytics metric for understanding traffic patterns | LOW | Automatic capture on route changes in Next.js App Router |
| **Custom event tracking** | Track user actions beyond page views (button clicks, form submits) | LOW | Manual capture API with event name and properties |
| **Anonymous user tracking** | Privacy-first analytics without PII, generates random session IDs | LOW | Default behavior, no user identification required |
| **Metadata/context enrichment** | Add consistent context to all logs (userId, environment, version) | MEDIUM | Global context plus per-request context propagation |
| **Correlation IDs** | Track single request across services, essential for distributed systems | MEDIUM | Generate UUID per request, propagate through all logs/calls |

### Differentiators (Competitive Advantage)

Features that set apart great observability from basic logging, and advanced analytics from simple tracking.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Service-level context isolation** | Each service (timer, invoice, billing) logs with its own context namespace | MEDIUM | Makes querying specific domains easier, reduces noise in log search |
| **Webhook lifecycle tracking** | Full observability of webhook delivery: received → validated → processed → responded | HIGH | Critical for Stripe integration debugging, includes retry logic visibility |
| **Timer lifecycle events** | Track complete user journey: start → pause → resume → stop → save | MEDIUM | Product analytics gold mine for understanding engagement patterns |
| **Invoice lifecycle events** | Track: draft → finalized → sent → viewed → paid → overdue | MEDIUM | Business metrics tied directly to revenue, enables funnel analysis |
| **Billing event tracking** | Subscription lifecycle: checkout → active → renewal → cancellation → churn | HIGH | Revenue intelligence, integrates Stripe webhook events with user actions |
| **Email delivery tracking** | Log email sends with template, recipient (hashed), outcome | MEDIUM | Debug email failures, track delivery rates, correlate with user actions |
| **Performance metrics** | P95/P99 latency for API routes, database queries, external API calls | HIGH | Beyond basic logging, requires metric aggregation and statistical analysis |
| **Error classification** | Categorize errors: client (4xx), server (5xx), validation, transient, fatal | MEDIUM | Enables targeted alerting and prioritization of fixes |
| **Batch operation logging** | Track bulk operations (multi-delete, bulk invoice send) with success/failure counts | MEDIUM | Critical for CRUD operations, shows partial failures clearly |
| **Cron job observability** | Track scheduled job execution: started, duration, success/failure, next run | MEDIUM | Essential for auto-pause timers and scheduled reports |
| **User funnel analysis** | Multi-step conversion tracking (signup → first project → first time entry → first invoice) | HIGH | Product analytics differentiator, requires event sequence correlation |
| **Retention cohorts** | Track user return rates by signup week/month, engagement over time | HIGH | Advanced analytics, requires historical event aggregation |
| **Feature usage heatmap** | Which features get used most/least, by user segment or time period | MEDIUM | PostHog provides this through event volume analysis |
| **Log sampling for high-volume endpoints** | Sample debug logs in production to control costs while maintaining visibility | HIGH | Prevents runaway costs, requires intelligent sampling logic |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable but create problems or aren't needed for this integration scope.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Session replay** | "See exactly what users did before error" | Privacy concerns, storage costs explode quickly, GDPR complexity | Use event sequences + error context instead — logs tell the story |
| **Real-time dashboard creation** | "Need custom dashboards in code" | Premature optimization, requirements unclear until data flows | Ship events first, build dashboards manually in PostHog/Axiom after seeing patterns |
| **User identification in PostHog** | "Want to know which user did what" | PII sent to third party violates privacy-first constraint | Use anonymous tracking + server-side logs with hashed IDs for correlation if needed |
| **Debug logs in production** | "More detail helps debugging" | Log volume explosion → cost spiral, signal-to-noise ratio collapses | Use INFO baseline, enable DEBUG temporarily via feature flag when needed |
| **Logging all database queries** | "Want to see every DB call" | High cardinality, massive volume, database already has query logs | Log slow queries (>100ms) only, or aggregate query counts per endpoint |
| **Feature flags via PostHog** | "Can toggle features remotely" | Adds complexity, not needed for observability milestone | Defer to separate feature flag milestone if needed later |
| **Custom alerting rules in code** | "Want alerts defined in app code" | Alert logic should live in observability platform, not application code | Configure alerts in Axiom dashboard after integration |
| **Distributed tracing (OpenTelemetry)** | "Full request path across services" | Overkill for monolith Next.js app, BillMint isn't microservices | Use correlation IDs instead — simpler, sufficient for single-app tracing |
| **Metrics aggregation in app** | "Calculate stats before sending" | Observability platforms do this better, don't reinvent the wheel | Send raw events, let Axiom/PostHog aggregate |
| **Synchronous log shipping** | "Guarantee logs are sent immediately" | Adds latency to every request, defeats async benefits | Use async/background log shipping, accept eventual consistency |

## Feature Dependencies

```
Environment Filtering (production-only)
    └──requires──> Structured Logging (base capability)
                       └──enables──> All logging features

Correlation IDs
    └──requires──> Request/Response Logging
    └──enables──> Webhook Lifecycle Tracking
    └──enables──> Distributed Request Tracing

Metadata/Context Enrichment
    └──requires──> Structured Logging
    └──enables──> Service-Level Context Isolation
    └──enables──> Error Classification

Custom Event Tracking
    └──requires──> Page View Tracking (base SDK setup)
    └──enables──> Timer Lifecycle Events
    └──enables──> Invoice Lifecycle Events
    └──enables──> Billing Event Tracking
    └──enables──> User Funnel Analysis

User Funnel Analysis
    └──requires──> Timer Lifecycle Events
    └──requires──> Invoice Lifecycle Events
    └──requires──> Billing Event Tracking
    └──conflicts──> Cannot work without multi-event tracking

Performance Metrics
    └──requires──> Request/Response Logging (for latency)
    └──enhances──> Error Tracking (slow requests often correlate with errors)

Log Sampling
    └──requires──> Log Levels (sample based on severity)
    └──conflicts──> Debug Logs in Production (sampling reduces debug visibility)
```

### Dependency Notes

- **Environment Filtering must come first:** All other features depend on this gate to prevent dev noise
- **Correlation IDs are foundational:** Required before implementing any cross-service or lifecycle tracking
- **Custom Event Tracking unlocks product analytics:** All lifecycle events (timer, invoice, billing) build on this
- **Service-Level Context Isolation enables query efficiency:** Without namespace isolation, logs become unsearchable at scale
- **Log Sampling conflicts with Debug Logs:** Can't have both — must choose between cost control and verbose logging

## MVP Definition

### Launch With (v1)

Minimum viable observability and analytics — what's essential for production visibility.

- [x] **Structured JSON logging** — Foundation for everything else
- [x] **Environment filtering (production-only)** — Prevent dev noise
- [x] **Request/response logging for all API routes** — Basic API observability
- [x] **Error tracking with stack traces** — Debug production issues
- [x] **Correlation IDs** — Trace requests end-to-end
- [x] **Replace all console.error calls** — Single logging system
- [x] **Page view tracking (PostHog)** — Baseline analytics
- [x] **Custom event tracking API** — Foundation for lifecycle events
- [x] **Timer lifecycle events** — Start, pause, resume, stop, discard
- [x] **Invoice lifecycle events** — Create, send, view, mark paid, void
- [x] **Billing events** — Checkout, subscription active, cancellation
- [x] **Anonymous user tracking** — Privacy-first analytics

**Why these:** Covers all 4 observability pillars (logs, errors, requests, events) + all 3 key BillMint domains (timer, invoice, billing). Everything else can be added incrementally.

### Add After Validation (v1.x)

Features to add once core integration is working and real data is flowing.

- [ ] **Service-level context isolation** — Trigger: Logs become hard to query efficiently
- [ ] **Webhook lifecycle tracking** — Trigger: First Stripe webhook debugging session reveals need
- [ ] **Email delivery tracking** — Trigger: User reports "invoice email not received"
- [ ] **Performance metrics (P95/P99)** — Trigger: Need to identify slow endpoints
- [ ] **Error classification** — Trigger: Alert fatigue from undifferentiated error volume
- [ ] **Cron job observability** — Trigger: Auto-pause timer fails silently
- [ ] **Batch operation logging** — Trigger: First bulk operation ships (if needed)
- [ ] **User funnel analysis** — Trigger: Product team asks "how many users complete onboarding?"
- [ ] **Feature usage heatmap** — Trigger: Need to prioritize roadmap based on actual usage

**Why defer:** These are valuable but not blocking. Launch with core visibility first, add sophistication based on real needs.

### Future Consideration (v2+)

Features that may become valuable at scale but aren't needed for initial integration.

- [ ] **Retention cohorts** — Wait for: User base > 1000 monthly actives
- [ ] **Log sampling** — Wait for: Axiom bill > $50/month or log volume becomes noisy
- [ ] **Advanced error classification** — Wait for: Error volume > 100/day
- [ ] **A/B testing integration** — Wait for: Product team defines experiments to run
- [ ] **Custom PostHog dashboards** — Wait for: Team understands key metrics after 2-3 months

**Why defer:** Premature optimization. These solve problems you might not have yet.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Structured JSON logging | HIGH | LOW | P1 |
| Environment filtering | HIGH | LOW | P1 |
| Request/response logging | HIGH | MEDIUM | P1 |
| Error tracking | HIGH | LOW | P1 |
| Correlation IDs | HIGH | MEDIUM | P1 |
| Replace console.error | HIGH | MEDIUM | P1 |
| Page view tracking | HIGH | LOW | P1 |
| Custom event tracking | HIGH | LOW | P1 |
| Timer lifecycle events | HIGH | MEDIUM | P1 |
| Invoice lifecycle events | HIGH | MEDIUM | P1 |
| Billing events | HIGH | HIGH | P1 |
| Anonymous user tracking | HIGH | LOW | P1 |
| Service-level context | MEDIUM | MEDIUM | P2 |
| Webhook lifecycle tracking | HIGH | HIGH | P2 |
| Email delivery tracking | MEDIUM | MEDIUM | P2 |
| Performance metrics | MEDIUM | HIGH | P2 |
| Error classification | MEDIUM | MEDIUM | P2 |
| Cron job observability | MEDIUM | MEDIUM | P2 |
| Batch operation logging | MEDIUM | MEDIUM | P2 |
| User funnel analysis | HIGH | HIGH | P2 |
| Feature usage heatmap | MEDIUM | MEDIUM | P2 |
| Retention cohorts | MEDIUM | HIGH | P3 |
| Log sampling | MEDIUM | HIGH | P3 |
| Advanced error classification | LOW | HIGH | P3 |
| A/B testing integration | LOW | HIGH | P3 |
| Custom PostHog dashboards | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — core observability and analytics
- P2: Should have, add when specific need arises
- P3: Nice to have, future consideration

## Observability vs Analytics Feature Split

### Axiom Features (Backend Observability)

Production-grade structured logging for debugging and monitoring backend services.

**Core capabilities:**
- Structured JSON logging with log levels
- Request/response logging for all API routes
- Error tracking with stack traces and context
- Correlation IDs for request tracing
- Service-level context isolation (namespace per service)
- Webhook lifecycle tracking (Stripe integration)
- Email delivery tracking
- Cron job observability
- Performance metrics (latency, slow queries)
- Error classification (client/server/transient)
- Batch operation logging

**Key patterns:**
- Replace all `console.error()` calls with Axiom logger
- Log at service boundaries (API routes, service methods, external API calls)
- Include rich metadata (userId, correlationId, service, method, duration)
- Log outcome of all async operations (email sent, webhook processed)
- Production-only (no dev noise)

### PostHog Features (Product Analytics)

Privacy-first anonymous analytics for understanding user behavior and product usage.

**Core capabilities:**
- Page view tracking (automatic)
- Custom event tracking (manual capture)
- Anonymous user tracking (no PII)
- Timer lifecycle events (start/pause/resume/stop/discard)
- Invoice lifecycle events (create/send/view/paid/void)
- Billing events (checkout/active/cancel)
- User funnel analysis (multi-step conversions)
- Retention cohorts (return rates over time)
- Feature usage heatmap (which features get used)

**Key patterns:**
- Track all user-initiated actions (button clicks, form submits)
- Track state transitions (timer started → paused → stopped)
- Track business outcomes (invoice sent → invoice paid)
- Never send PII (no names, emails, IPs)
- Production-only (no dev noise)

**What NOT to track:**
- Internal system events (use Axiom for those)
- Database operations (use Axiom for those)
- API errors (use Axiom for those)
- Backend service calls (use Axiom for those)

## Expected Integration Behavior

### What Production SaaS Observability Looks Like

Based on industry standards and best practices from the research:

**On API Request:**
1. Middleware generates correlation ID
2. Log request: method, path, correlationId, timestamp
3. Execute route handler
4. Log response: status, duration, correlationId
5. If error: Log stack trace, error type, correlationId
6. Send all logs async to Axiom (non-blocking)

**On User Action (Frontend):**
1. User clicks button (e.g., "Start Timer")
2. PostHog captures event: `timer_started` with properties `{project_id, description}`
3. Event sent async to PostHog (non-blocking)
4. Page navigation triggers automatic pageview capture

**On Background Job (Cron):**
1. Log job start: `cron.auto_pause_timers.started`
2. Execute job logic
3. Log outcome: `cron.auto_pause_timers.completed` with `{timers_paused, duration}`
4. If error: Log with context: `cron.auto_pause_timers.failed` with `{error, timers_checked}`

**On External API Call (Stripe Webhook):**
1. Log webhook received: `stripe.webhook.received` with `{event_type, correlationId}`
2. Validate signature
3. If invalid: Log and return 401
4. Process webhook
5. Log outcome: `stripe.webhook.processed` with `{event_type, status, duration}`
6. If error: Log with full context for retry debugging

### Cost and Performance Expectations

**Axiom:**
- First 500 GB/month free, then $0.25/GB
- Typical SaaS: 10-50 GB/month for 1000 MAU
- Latency impact: <5ms per request (async logging)
- Retention: 30 days default, configurable

**PostHog:**
- First 1M events/month free
- Typical SaaS: 100K-500K events/month for 1000 MAU
- Latency impact: <2ms (async tracking)
- Anonymous tracking: No GDPR consent required

**BillMint estimate (1000 MAU):**
- Axiom: ~20 GB/month (free tier) — 50 API calls/user/day × 1000 users × 30 days × 10 KB/log
- PostHog: ~300K events/month (free tier) — 10 events/user/day × 1000 users × 30 days

## Sources

### Axiom Research
- [Send data from Next.js app to Axiom](https://axiom.co/docs/send-data/nextjs)
- [Axiom's new JS logging libraries](https://axiom.co/blog/new-js-logging)
- [Logging with Axiom on NextJS API Routes](https://www.imakewebsites.ca/posts/axiom-logging-nextjs-api-routes/)
- [GitHub - axiomhq/next-axiom](https://github.com/axiomhq/next-axiom)
- [Axiom Observability](https://axiom.co/solutions/observability)

### PostHog Research
- [Using PostHog with Next.js App Router and Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics)
- [Integration Next.js Application with PostHog](https://medium.com/@say2ankitgupta/integration-posthog-with-a-next-js-application-1d99de47fb98)
- [PostHog integration in Next.JS App Router](https://reetesh.in/blog/posthog-integration-in-next.js-app-router)
- [GDPR compliant posthog tracking without consent](https://www.psimms.de/posts/gdpr-compliant-posthog-tracking-without-consent/)

### Observability Best Practices
- [Structured Logging - A Developer's Guide](https://signoz.io/blog/structured-logs/)
- [Practical Structured Logging for Modern Applications](https://www.dash0.com/guides/structured-logging-for-modern-applications)
- [Log Management Best Practices](https://logmanager.com/blog/log-management/log-management-best-practices/)
- [Monitoring & Observability: Logs, Metrics, Traces, Alerts](https://blog.railway.com/p/using-logs-metrics-traces-and-alerts-to-understand-system-failures)
- [Webhooks at Scale: Best Practices](https://hookdeck.com/blog/webhooks-at-scale)

### Correlation IDs and Tracing
- [Correlation IDs - Engineering Fundamentals Playbook](https://microsoft.github.io/code-with-engineering-playbook/observability/correlation-id/)
- [Correlation ID: The Invisible Thread That Unifies Microservices](https://medium.com/@anil.goyal0057/understanding-and-implementing-correlation-id-in-microservices-2900518954a0)
- [Trace ID vs Correlation ID](https://last9.io/blog/correlation-id-vs-trace-id/)

### Cost Optimization
- [5 Powerful Tips to Reduce Your Observability Costs](https://middleware.io/blog/reduce-observability-costs/)
- [Strategies to Reduce Your Observability Costs](https://drdroid.io/engineering-tools/strategies-to-reduce-your-observability-costs)
- [Observability Cost Reduction Strategy](https://www.mezmo.com/learn-observability/observability-cost-reduction-a-practical-guide)

### Product Analytics Concepts
- [Product Analytics Tools: Top Picks from Real PMs](https://productschool.com/blog/analytics/product-analytics-tools)
- [Top 14 SaaS Product Usage Metrics](https://uxcam.com/blog/saas-product-usage-metrics/)
- [Amplitude 101: Building Your First Funnel & Retention Charts](https://e-cens.com/blog/amplitude-101-building-your-first-essential-analyses-part-3-of-getting-started-series/)
- [Cohort Retention Analysis 101](https://userpilot.com/blog/cohort-retention-analysis/)

---
*Feature research for: BillMint Observability & Analytics*
*Researched: 2026-02-11*
