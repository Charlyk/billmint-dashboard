# Project Research Summary

**Project:** BillMint Observability & Analytics Integration
**Domain:** Production Logging and Product Analytics for Next.js SaaS
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

BillMint needs production-grade observability to replace 124+ console.error calls across 14 service files with structured logging (Axiom) and add privacy-first product analytics (PostHog). Research shows this is a well-trodden path with mature tooling: Axiom's new 2026 logging libraries (@axiomhq/nextjs, @axiomhq/react, @axiomhq/logging) provide Next.js App Router-native integration, while PostHog offers battle-tested anonymous analytics that can bypass ad blockers via reverse proxy.

The recommended approach follows a foundation-first pattern: establish production-only logging infrastructure with PII sanitization and trace correlation (Phase 1), migrate services systematically starting with highest-value areas like billing and webhooks (Phase 2), then layer on product analytics with lifecycle event tracking for timers, invoices, and subscriptions (Phase 3). This order prevents the most critical pitfall: data pollution from development environments and PII leakage in logs.

Key risks center on three areas: (1) logging sensitive data from Stripe webhooks or Supabase queries, requiring strict sanitization; (2) webhook timeout caused by synchronous logging, requiring fire-and-forget patterns; (3) uncontrolled log volume explosion from timer ticks or large query results, requiring sampling strategy. All three are preventable with upfront architectural decisions rather than post-deployment fixes.

## Key Findings

### Recommended Stack

The 2026 Axiom logging ecosystem represents a significant architectural shift from the deprecated next-axiom package. The new modular approach separates concerns: @axiomhq/logging handles core functionality, @axiomhq/nextjs provides App Router-specific helpers, and @axiomhq/react enables client-side logging. This eliminates the need for Winston/Pino transport layers that older patterns required.

**Core technologies:**
- **@axiomhq/nextjs (v0.2.0)**: Next.js-specific logging for middleware, route handlers, and server components. Part of Axiom's reimagined 2026 ecosystem with Edge Runtime support.
- **@axiomhq/react (v0.2.0)**: React hooks for client-side logging. Works with React 18 & 19, provides context-aware logging in components.
- **@axiomhq/logging (v0.2.0)**: Framework-agnostic core. Required peer dependency that handles transport and batching.
- **posthog-js (v1.345.4)**: Industry-standard client SDK with 1.3M weekly downloads. Provides autocapture, feature flags, and session recording (though BillMint will disable recording for privacy).
- **posthog-node (v5.24.15, optional)**: Only needed for server-side feature flags or backend event tracking in React Server Components.

**Critical avoidances:**
- DO NOT use deprecated next-axiom (maintenance mode only, lacks modular architecture)
- DO NOT use Winston/Pino transports with new Axiom libs (unnecessary complexity)
- DO NOT use experimental @posthog/nextjs (v0.0.3, too new for production)
- DO NOT mix console.log in production (unstructured, no aggregation, lost on serverless)

**Version compatibility:**
All packages support Next.js 14-16 with App Router and Edge Runtime. PostHog works with both Pages Router and App Router. Critical: Axiom's new packages conflict with next-axiom — remove completely before migration.

### Expected Features

Research reveals two distinct feature sets: backend observability (Axiom) and product analytics (PostHog), with clear boundaries between them.

**Must have (table stakes):**
- Structured JSON logging with consistent schema across all services
- Log levels (debug/info/warn/error) with production filtering
- Request/response logging capturing method, path, status, latency
- Error tracking with full stack traces and contextual metadata
- Environment filtering (production-only activation)
- Page view tracking (automatic on route changes)
- Custom event tracking API for manual capture
- Anonymous user tracking (random session IDs, no PII)
- Metadata enrichment (userId, environment, version, service)
- Correlation IDs for distributed request tracing

**Should have (competitive advantage):**
- Service-level context isolation (namespace per domain: timer, invoice, billing)
- Webhook lifecycle tracking (received → validated → processed → responded)
- Timer lifecycle events (start → pause → resume → stop → save)
- Invoice lifecycle events (draft → finalized → sent → viewed → paid)
- Billing event tracking (checkout → active → renewal → cancellation)
- Email delivery tracking with Resend message IDs
- Performance metrics (P95/P99 latency for critical routes)
- Error classification (4xx client, 5xx server, validation, transient)
- Cron job observability (execution tracking for auto-pause timers)
- User funnel analysis (multi-step conversion sequences)

**Defer (v2+):**
- Retention cohorts (wait for 1000+ MAU)
- Log sampling (implement when costs exceed $50/month)
- Session replay (privacy concerns, disabled for anonymous tracking)
- Feature flags via PostHog (separate milestone if needed)
- Custom dashboards in code (build manually in UI after seeing patterns)
- Real-time alerting rules (configure in Axiom dashboard post-launch)

**Anti-features (commonly requested but problematic):**
- Session replay: Privacy violations, storage cost explosion, GDPR complexity
- User identification in PostHog: Violates privacy-first constraint
- Debug logs in production: Log volume explosion, cost spiral
- Logging all database queries: High cardinality, massive volume
- Distributed tracing with OpenTelemetry: Overkill for monolith architecture

### Architecture Approach

The standard architecture follows a layered observability pattern: client components use PostHog for navigation and interaction tracking, middleware captures request context and generates trace IDs, API routes wrap with withAxiom() for automatic instrumentation, and service layers import a centralized logger utility that handles environment gating and sanitization.

**Major components:**
1. **Logger Utility (lib/observability/logger.ts)**: Singleton pattern wrapping @axiomhq/nextjs with production-only checks, PII sanitization, and circular reference protection. All services import this instead of calling console methods.
2. **Axiom Middleware**: Extends existing middleware.ts to generate correlation IDs, log request metadata, and propagate context through headers (x-request-id, x-user-id).
3. **PostHog Provider (components/analytics/posthog-provider.tsx)**: Client component wrapping root layout, initializes posthog-js with reverse proxy config to bypass ad blockers.
4. **PostHog Pageview Tracker**: Uses usePathname() and useSearchParams() hooks to capture route changes, handles App Router navigation patterns.
5. **withAxiom() Wrapper**: Higher-order function instrumenting API routes with automatic request/response logging and error capture, exposes request.log for handler-specific logs.
6. **Analytics Events Module (lib/analytics/events.ts)**: Type-safe event definitions with standardized naming, prevents event name typos, documents event catalog.
7. **PostHog Server Client (lib/analytics/posthog.ts)**: Singleton posthog-node instance for backend event tracking (subscription changes, invoice generation, payment processing).

**Key architectural patterns:**
- **Production-Only Logging**: All logging gated by NODE_ENV === 'production' check, falls back to console in development. Prevents data pollution and cost inflation.
- **Dual-Client Analytics**: PostHog browser SDK for client interactions, PostHog Node SDK for server-side business events. Provides complete coverage without gaps.
- **Structured Context Propagation**: Middleware generates trace ID, API routes propagate via headers, services include in all log statements. Enables request correlation across distributed calls.
- **Centralized Sanitization**: Logger utility strips PII patterns before logging, configured allowlist for loggable fields. Single point of enforcement.
- **Fire-and-Forget Async**: All logging uses async batching, never blocks request responses. Critical for webhook handlers that must respond <5 seconds.

**Data flow:**
Service error → logger.error(message, context) → [production check] → Axiom logger instance → batch buffer (20 logs or 5s) → Axiom API. User navigation → PostHogPageView component → posthog.capture('$pageview') → reverse proxy /ingest/* → PostHog API. Business event → service function → posthog.capture({distinctId, event, properties}) → posthog.shutdown() flush → PostHog API.

### Critical Pitfalls

Research identified 12 documented pitfalls, with 6 classified as critical based on impact and frequency in Next.js observability integrations.

1. **Logging Sensitive Data (PII/Payment Information)**: Logging full request/response objects, Stripe webhook payloads, or Supabase query results exposes emails, payment details, session tokens. Creates GDPR violations and security vulnerabilities. Avoid: Create sanitization function stripping sensitive fields, use allowlists for loggable fields, configure Axiom beforeSend hook, never log full Stripe payloads. Address in Phase 1 (Foundation) before any production logging.

2. **Circular Reference JSON Serialization Failures**: Next.js Request objects, Supabase client instances, and complex error objects contain circular references. When Axiom serializes for transport, JSON.stringify crashes with "Converting circular structure to JSON", breaking error handlers. Avoid: Extract only needed fields from Request (url, method, headers), use structured logging libraries handling circular refs, create wrapper functions for common objects. Address in Phase 1 (Foundation) with safe extraction helpers.

3. **Development Environment Data Pollution**: Logging in development pollutes production metrics, inflates costs, triggers false alerts. With 124+ console.error calls being replaced, creates massive noise. Avoid: Gate all logging with NODE_ENV checks, configure PostHog enabled flag, test production builds locally, use separate staging dataset. Address in Phase 1 (Foundation) as first implementation step.

4. **Webhook Processing Timeout Due to Synchronous Logging**: Stripe requires webhook responses <5 seconds. Synchronous Axiom calls add 100-500ms per log statement, causing timeouts, retries, duplicate processing, failed payments. Avoid: Use Axiom async batching (5s buffer), never await logging in webhooks, implement in-memory queue flushing after response, monitor response times <3s. Address in Phase 2 (Service Instrumentation) for webhook handlers.

5. **Missing Context Propagation in Distributed Traces**: Logs from API routes, Supabase RPC, Stripe, Resend lack correlation. Can't connect timer-stop → time-entry → invoice → email chain when debugging. Avoid: Generate trace ID in middleware, pass to services as parameter, include in all log statements, propagate through external API calls. Address in Phase 1 (Foundation) immediately after environment gating.

6. **Uncontrolled Log Volume Explosion**: Logging timer ticks (every second), all Supabase results, every PostHog event generates 10,000+ events per user per day. Creates unpredictable costs, unsearchable logs, platform overload. Avoid: Implement sampling (10% INFO, 100% ERROR), never log timer tick updates (only state changes), log query metadata not full results, use log levels correctly, set Axiom dataset limits. Address in Phase 1 (Foundation) with sampling strategy and Phase 3 (Cost Controls) with monitoring.

**Moderate pitfalls requiring attention:**
- TypeScript type safety with req.log (requires module augmentation)
- PostHog hydration mismatches in App Router (use Suspense boundaries)
- Rate limiter/logging middleware conflicts (careful matcher configuration)
- Cron job logging without execution summaries (log counts, not just success)
- Email delivery tracking missing Resend message IDs (can't correlate later)
- Anonymous tracking creating user journey gaps (document as privacy tradeoff)

## Implications for Roadmap

Based on research findings, the integration requires a sequential build order with clear dependency chains. The architecture demands foundation-first construction: environment gating and sanitization must exist before any service instrumentation, trace ID propagation must work before tracking lifecycle events, and cost controls need baseline data before optimization.

### Phase 1: Foundation & Infrastructure
**Rationale:** All subsequent phases depend on production-only logging, PII sanitization, and trace correlation. Research shows that retrofitting these after services are instrumented creates months of polluted data that can't be cleaned. The foundation must prevent critical pitfalls (data pollution, PII leakage, missing correlation) before any production logs are generated.

**Delivers:**
- Logger utility module with environment gating (production-only)
- PII sanitization helpers for common objects (Request, Error, Supabase results)
- Circular reference protection for safe JSON serialization
- Trace ID generation and propagation via middleware
- Axiom SDK installation and configuration
- PostHog SDK installation (browser + server)
- Environment variables setup (AXIOM_TOKEN, AXIOM_DATASET, NEXT_PUBLIC_POSTHOG_KEY)
- PostHog provider component with reverse proxy config
- PostHog pageview tracker for automatic navigation tracking

**Addresses features:**
- Structured JSON logging (table stakes)
- Environment filtering (table stakes)
- Correlation IDs (table stakes)
- Anonymous user tracking (table stakes)
- Page view tracking (table stakes)

**Avoids pitfalls:**
- Development environment data pollution (CRITICAL)
- Logging sensitive data (CRITICAL)
- Circular reference crashes (CRITICAL)
- Missing context propagation (CRITICAL)

**Research flag:** Standard patterns, no phase-specific research needed. Official docs provide clear implementation paths.

### Phase 2: Service Migration & Instrumentation
**Rationale:** With foundation in place, systematically replace console.error calls service-by-service. Research identifies high-value targets: billing.service.ts (payment failures critical), webhook handlers (timeout risk), invoice.service.ts (business logic). This phase must address webhook timeout pitfall with fire-and-forget logging patterns.

**Delivers:**
- Replace console.error in 14 service files with logger.error/info/warn
- Add structured context to all logs (service, action, userId, duration)
- Wrap critical API routes with withAxiom() (auth, billing, timer, invoice)
- Implement async-first logging in webhook handlers (Stripe integration)
- Add request/response logging to middleware
- Create service-level context isolation (namespace per domain)
- Migrate error handler (lib/utils/errors.ts) to use logger

**Addresses features:**
- Request/response logging (table stakes)
- Error tracking with stack traces (table stakes)
- Service-level context isolation (differentiator)
- Webhook lifecycle tracking (differentiator)
- Cron job observability (differentiator)
- Error classification (differentiator)

**Avoids pitfalls:**
- Webhook processing timeout (CRITICAL - async logging in billing.service.ts)
- TypeScript type safety issues (moderate - use typed wrappers)
- Rate limiter/logging middleware conflicts (moderate - matcher config)
- Cron job logging gaps (moderate - execution summaries)

**Research flag:** Standard service migration, no research needed. Webhook async patterns well-documented.

### Phase 3: Product Analytics & Lifecycle Events
**Rationale:** With backend observability operational, layer on product analytics. Research shows dual-client pattern: client SDK for UI interactions, server SDK for business events. This phase completes the observability picture by tracking user journeys (timer → invoice → payment) and enabling funnel analysis.

**Delivers:**
- PostHog server client for backend event tracking
- Timer lifecycle event tracking (start, pause, resume, stop, discard)
- Invoice lifecycle event tracking (create, send, view, paid, void)
- Billing event tracking (checkout, subscription active, cancellation, churn)
- Custom event tracking API for manual capture
- Email delivery tracking with Resend message IDs
- Event type definitions with standardized naming
- Event catalog documentation for team

**Addresses features:**
- Custom event tracking (table stakes)
- Timer lifecycle events (differentiator)
- Invoice lifecycle events (differentiator)
- Billing event tracking (differentiator)
- Email delivery tracking (differentiator)
- User funnel analysis (differentiator)

**Avoids pitfalls:**
- PostHog hydration mismatches (moderate - Suspense boundaries)
- Anonymous tracking journey gaps (moderate - document tradeoff)
- Email delivery blindness (moderate - track message IDs)

**Research flag:** Standard PostHog integration, no research needed. Event tracking patterns well-established.

### Phase 4: Cost Controls & Performance Optimization
**Rationale:** With full observability operational, real production data reveals volume patterns. Research warns that log volume can explode 3-5x when adding context to existing console.error calls. This phase implements adaptive controls based on actual usage, not premature optimization.

**Delivers:**
- Log sampling implementation (10% INFO, 100% ERROR/WARN)
- Axiom dataset volume monitoring and alerts (80% threshold)
- PostHog event volume tracking
- Slow query identification and logging (>100ms threshold)
- Batch operation logging with success/failure counts
- Performance metrics collection (P95/P99 latency)
- Cost dashboard with budget alerts

**Addresses features:**
- Performance metrics (differentiator)
- Batch operation logging (differentiator)
- Log sampling (deferred v2 feature, brought forward if needed)

**Avoids pitfalls:**
- Uncontrolled log volume explosion (CRITICAL - sampling strategy)

**Research flag:** Standard cost optimization, no research needed. Sampling patterns established.

### Phase 5: Validation & Monitoring
**Rationale:** Research emphasizes that observability integrations often "look done but aren't" — missing production-only checks, PII sanitization, trace propagation. This phase validates all critical pieces before declaring complete.

**Delivers:**
- Production deployment with smoke tests
- Axiom dashboard verification (logs appearing correctly)
- PostHog dashboard verification (events flowing)
- Alert configuration (error rate spikes, webhook timeouts, cost thresholds)
- PII audit (regex query for sensitive patterns, expect zero results)
- Trace correlation testing (generate nested error, verify shared trace ID)
- Webhook timeout testing (Stripe test mode, verify <3s response)
- Event catalog documentation
- Runbook for common issues

**Addresses:**
- "Looks done but isn't" checklist from research
- Production readiness validation
- Team enablement (documentation, runbooks)

**Avoids pitfalls:**
- All moderate/minor pitfalls caught before production load

**Research flag:** No research needed, validation only.

### Phase Ordering Rationale

**Sequential dependencies:**
- Phase 1 must complete before Phase 2 (services need logger utility and trace IDs)
- Phase 2 must complete before Phase 3 (backend events need server instrumentation)
- Phase 3 should complete before Phase 4 (need real data to optimize costs)
- Phase 4 can partially overlap Phase 3 (monitoring setup doesn't block events)
- Phase 5 runs after all phases (end-to-end validation)

**Parallel opportunities:**
- PostHog client setup (Phase 1) can run parallel to service migration (Phase 2)
- Cost monitoring setup (Phase 4) can start during Phase 3
- Documentation (Phase 5) can be written throughout

**Critical path:** Phase 1 → Phase 2 → Phase 3. Cost controls (Phase 4) and validation (Phase 5) are post-launch enhancements that don't block production deployment.

**Why this order prevents pitfalls:**
- Phase 1 prevents data pollution before any logs ship
- Phase 2 prevents webhook timeouts with async patterns
- Phase 3 prevents analytics gaps with dual-client approach
- Phase 4 prevents cost surprises with proactive monitoring
- Phase 5 prevents "looks done but isn't" with comprehensive checks

### Research Flags

**Phases with standard patterns (skip phase-specific research):**
- **Phase 1 (Foundation)**: Official Axiom and PostHog docs provide complete implementation guides. Next.js App Router patterns well-documented.
- **Phase 2 (Service Migration)**: Standard logging migration, no novel patterns. Webhook async logging has established patterns.
- **Phase 3 (Product Analytics)**: PostHog event tracking is well-trodden territory. Lifecycle event patterns standard across SaaS apps.
- **Phase 4 (Cost Controls)**: Log sampling and monitoring use industry-standard approaches.
- **Phase 5 (Validation)**: Checklist-driven, no research needed.

**No phases require `/gsd:research-phase`** — all patterns are well-documented with high-confidence sources. The integration combines mature tools (Axiom 2026 libs, PostHog 1.3M weekly downloads) with standard architectural patterns.

**If complications arise during execution:**
- Axiom Edge Runtime compatibility issues → research edge-specific patterns
- PostHog reverse proxy conflicts with existing middleware → research advanced proxy configs
- Supabase RPC logging integration → research Supabase telemetry best practices

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Axiom docs for 2026 libs, PostHog verified with Vercel guide, npm package stats confirm maturity |
| Features | HIGH | Feature research drew from official docs, industry best practices, multiple implementation guides |
| Architecture | HIGH | Standard observability patterns, verified with Next.js middleware docs, multiple real-world implementations |
| Pitfalls | HIGH | Drawn from documented GitHub issues, official troubleshooting guides, real production incidents |

**Overall confidence:** HIGH

Research leveraged official documentation (Axiom, PostHog, Next.js, Stripe), verified package versions on npm, cross-referenced with community implementations, and identified documented pitfalls from GitHub issues and production postmortems. The stack uses mature tools with clear migration paths. The architecture follows established patterns for Next.js App Router observability.

### Gaps to Address

**Minor uncertainties requiring validation during implementation:**

- **Edge Runtime compatibility**: Axiom's new @axiomhq/nextjs claims Edge Runtime support, but limited production examples. May need edge-specific logger configuration if middleware logging fails. Mitigation: Test in Vercel Edge Functions early, have fallback to Node.js runtime if needed.

- **Supabase RPC logging integration**: No documented patterns for adding trace IDs to Supabase RPC calls for database-side logging. May need custom parameter passing. Mitigation: Log at service layer before/after RPC call, accept that database internal logs won't correlate.

- **PostHog reverse proxy with existing rate limiter**: BillMint has rate limiting on public invoice routes. Reverse proxy config may conflict with existing middleware matchers. Mitigation: Test thoroughly in Phase 1, potentially use separate proxy path.

- **Resend webhook delivery tracking**: Resend webhooks for email delivery status may require separate endpoint setup. Not critical for Phase 2, can defer to Phase 4. Mitigation: Track Resend message IDs in Phase 2, add webhook handler in Phase 4 if delivery tracking becomes critical.

**No blockers identified** — all gaps have clear mitigation strategies and don't prevent starting implementation.

## Sources

### Primary Sources (HIGH confidence)

**Official Documentation:**
- [Axiom Next.js Integration](https://axiom.co/docs/send-data/nextjs) — Setup guide for new 2026 libs
- [Axiom New JS Logging Libraries Blog](https://axiom.co/blog/new-js-logging) — Architecture rationale
- [PostHog Next.js App Router with Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics) — Verified implementation
- [Next.js Logging Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging) — Framework patterns
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) — Context propagation
- [Stripe Webhook Best Practices](https://docs.stripe.com/webhooks/best-practices) — Timeout requirements

**Package Registries:**
- [@axiomhq/nextjs v0.2.0](https://www.npmjs.com/package/@axiomhq/nextjs) — Jan 27, 2026 release
- [posthog-js v1.345.4](https://www.npmjs.com/package/posthog-js) — Feb 11, 2026, 1.3M weekly downloads
- [posthog-node v5.24.15](https://www.npmjs.com/package/posthog-node) — Current stable

**GitHub Issues & Real-World Feedback:**
- [axiomhq/next-axiom #119](https://github.com/axiomhq/next-axiom/issues/119) — API timeout with logging
- [PostHog/posthog-js #1461](https://github.com/PostHog/posthog-js/issues/1461) — Next.js setup feedback
- [vercel/next.js #85244](https://github.com/vercel/next.js/issues/85244) — Circular structure errors

### Secondary Sources (MEDIUM confidence)

**Best Practices & Patterns:**
- [Structured Logging for Next.js (Arcjet)](https://blog.arcjet.com/structured-logging-in-json-for-next-js/) — Patterns
- [PostHog for SaaS Guide](https://bix-tech.com/posthog-for-saas-a-practical-guide-to-product-analytics-and-event-tracking/) — Event tracking
- [GDPR-Compliant PostHog Tracking](https://www.psimms.de/posts/gdpr-compliant-posthog-tracking-without-consent/) — Anonymous analytics
- [Correlation IDs - Engineering Playbook](https://microsoft.github.io/code-with-engineering-playbook/observability/correlation-id/) — Tracing patterns
- [Log Sampling Best Practices (Better Stack)](https://betterstack.com/community/guides/logging/log-sampling/) — Cost control

**Comparison & Alternatives:**
- [Axiom Alternatives Analysis](https://signoz.io/comparisons/axiom-alternatives/) — When to use Axiom
- [PostHog vs Mixpanel vs Amplitude](https://www.brainforge.ai/resources/amplitude-vs-mixpanel-vs-posthog) — Analytics comparison
- [Datadog vs Sentry Comparison](https://betterstack.com/community/comparisons/datadog-vs-sentry/) — Feature comparison

### Tertiary Sources (LOW confidence, requires validation)

**Implementation Guides:**
- [Axiom Logging NextJS API Routes](https://www.imakewebsites.ca/posts/axiom-logging-nextjs-api-routes/) — Community guide
- [PostHog Reverse Proxy with Next.js](https://medium.com/@vivek563maurya/how-to-use-reverse-proxy-for-posthog-in-nextjs-page-router-cb96b59d6ed9) — Ad blocker bypass
- [Integration PostHog with Next.js](https://medium.com/@say2ankitgupta/integration-posthog-with-a-next-js-application-1d99de47fb98) — Setup walkthrough

**Security & Compliance:**
- [Scrubbing Sensitive Data (Sentry)](https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management/sensitive-data/) — PII patterns
- [Logging Sensitive Data Best Practices](https://betterstack.com/community/guides/logging/sensitive-data/) — Security guide

---

**Research completed:** 2026-02-11
**Ready for roadmap:** Yes

**Next step:** Orchestrator can proceed to roadmap creation using this summary to structure phases, identify dependencies, and flag research needs.
