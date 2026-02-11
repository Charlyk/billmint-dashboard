# Pitfalls Research

**Domain:** Observability & Analytics Integration (Axiom + PostHog in Next.js SaaS)
**Researched:** 2026-02-11
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Logging Sensitive Data (PII/Payment Information)

**What goes wrong:**
Logging entire request/response objects, error payloads, or user data without sanitization exposes personally identifiable information (PII), payment details, session tokens, and API keys in logs. This creates GDPR/CCPA compliance violations and security vulnerabilities.

**Why it happens:**
When replacing 124+ console.error calls with structured logging, developers often log entire error objects, request payloads, or Supabase RPC responses that contain sensitive fields like email addresses, phone numbers, subscription data, or Stripe customer information.

**How to avoid:**
- Create a sanitization function that strips sensitive fields before logging
- Never log full request/response bodies from Stripe webhooks
- Use field allowlists for Supabase RPC results (log only IDs, not user data)
- Configure Axiom's `beforeSend` hook to scrub sensitive patterns
- For authentication errors, log error codes/types only, never credentials or tokens
- Audit all 14 service files to identify fields that must never be logged

**Warning signs:**
- Log entries containing email addresses, phone numbers, or payment card data
- Complete Stripe webhook payloads in logs
- Supabase RPC responses with user profile information
- API keys or session tokens appearing in error context
- Customer subscription details in billing service logs

**Phase to address:**
Phase 1 (Foundation) - Must be implemented before any production logging begins. Create sanitization utilities and establish logging guidelines that all subsequent phases follow.

---

### Pitfall 2: Circular Reference JSON Serialization Failures

**What goes wrong:**
Attempting to log Next.js Request objects, Supabase client instances, or complex error objects causes "TypeError: Converting circular structure to JSON" crashes. This breaks error handlers, making incidents invisible and ironically preventing the very observability you're trying to achieve.

**Why it happens:**
Next.js Request/Response objects contain circular references. Supabase client instances have complex internal state. Error objects from libraries like Axios include circular references. When Axiom tries to serialize these for transport, JSON.stringify fails catastrophically.

**How to avoid:**
- Never log raw `req` objects - extract only needed fields (req.url, req.method, req.headers)
- For Supabase errors: log error.message, error.code, query name, not the full client state
- Use structured logging libraries (Pino, Winston) that handle circular references automatically
- Create wrapper functions for common objects (request → { method, url, userId })
- Test serialization in development by forcing JSON.stringify on logged objects
- For timer context state: log timer IDs and status, not full React state objects

**Warning signs:**
- Crashes in error handlers (errors while logging errors)
- Missing log entries during incidents (silently failing serialization)
- Axiom showing empty/truncated logs for certain error types
- Development console showing "Converting circular structure" errors
- Logs work in development but fail in production (different object structures)

**Phase to address:**
Phase 1 (Foundation) - Create logging helpers that safely extract loggable fields from common objects (Request, Error, Supabase responses). Must be in place before service instrumentation begins.

---

### Pitfall 3: Development Environment Data Pollution

**What goes wrong:**
Logging and analytics tracking in development environments pollutes production metrics, inflates costs, triggers false alerts, and makes it impossible to distinguish real user behavior from developer testing. With 124+ console.error calls being replaced, this creates massive log noise.

**Why it happens:**
Developers forget to wrap logging/analytics initialization in production checks. Environment variables default to development values. PostHog/Axiom clients initialize unconditionally. Next.js runs both server and client code, making environment detection complex.

**How to avoid:**
- Gate all Axiom logging with `if (process.env.NODE_ENV === 'production')` checks
- Configure PostHog to initialize only in production: `enabled: process.env.NODE_ENV === 'production'`
- Use Next.js config to remove console logs in production builds: `removeConsole: { exclude: ['error'] }`
- For middleware: check NODE_ENV before logging since middleware runs on every request
- Create environment-aware logger factory that returns no-op logger in development
- Test production builds locally with `NODE_ENV=production npm run start`

**Warning signs:**
- Axiom showing traffic from localhost or development URLs
- PostHog events with test user IDs or development session identifiers
- Log volume spikes correlating with local development activity
- Multiple "session started" events from same developer machine
- Costs increasing during development sprints when no production changes deployed

**Phase to address:**
Phase 1 (Foundation) - Environment gating must be the first thing implemented, before any Axiom or PostHog code is written. This prevents months of polluted data that can't be cleaned retroactively.

---

### Pitfall 4: Webhook Processing Timeout Due to Synchronous Logging

**What goes wrong:**
Stripe requires webhook responses within 5 seconds. If Axiom logging is synchronous or network-dependent, webhook handlers timeout, causing Stripe to retry (duplicate processing), fail payment flows, or mark the webhook endpoint as unhealthy.

**Why it happens:**
Replacing console.error in webhook handlers with synchronous Axiom API calls adds 100-500ms of latency per log statement. Stripe webhooks process critical events (subscription updates, payment failures). Network issues to Axiom compound into multi-second delays.

**How to avoid:**
- Use Axiom's async batching: configure buffer to flush every 5 seconds, not per-event
- Never await logging calls in webhook handlers - fire and forget
- Implement in-memory queue for logs, flush async after webhook responds
- For critical webhook events: log to local buffer first, return success, then flush to Axiom
- Monitor webhook response times: alert if >3 seconds (before Stripe timeout)
- Use Stripe's webhook signature verification before any logging (fail fast)

**Warning signs:**
- Stripe dashboard showing webhook timeout errors
- Duplicate subscription events in database (retry side effects)
- Increasing webhook response times correlating with logging volume
- "Webhook signature verification after timeout" errors
- Failed payments with "webhook endpoint not responding" messages

**Phase to address:**
Phase 2 (Service Instrumentation) - Webhook handlers must use async-first logging patterns. This is critical for billing.service.ts which processes subscription lifecycle events.

---

### Pitfall 5: Missing Context Propagation in Distributed Traces

**What goes wrong:**
Logs from Next.js API routes, Supabase RPC calls, Stripe API requests, and Resend emails lack trace correlation. When investigating an issue (e.g., "invoice failed to send"), you can't connect the timer-stop event → time-entry creation → invoice generation → email sending chain.

**Why it happens:**
Each log statement is isolated. Supabase client calls don't inherit request context. External API calls (Stripe, Resend) don't propagate trace IDs. Timer context state changes happen client-side with no server correlation. No trace ID is passed between middleware → route handler → service → external API layers.

**How to avoid:**
- Generate trace ID in middleware, attach to request headers: `x-trace-id`
- Pass trace ID to all service layer functions as parameter
- Include trace ID in all Axiom log statements: `logger.info({ traceId, ... })`
- For Supabase RPC: add trace_id as parameter to RPC calls for DB-side logging
- Timer context: include trace ID in timer start/stop API calls
- Use OpenTelemetry if full distributed tracing is needed (overkill for this project)
- Log trace ID at entry/exit of critical flows: timer→entry→invoice→email

**Warning signs:**
- Cannot correlate timer stop event with invoice generation failure
- Email sending errors lack context about which invoice triggered them
- Supabase query failures don't connect to the API route that called them
- Multiple parallel requests create log soup with no way to separate flows
- Debugging requires manual timestamp correlation across service boundaries

**Phase to address:**
Phase 1 (Foundation) - Add trace ID to middleware immediately, then propagate through all phases. Without this, later phases will generate uncorrelated logs that require refactoring.

---

### Pitfall 6: Uncontrolled Log Volume Explosion

**What goes wrong:**
Logging every timer tick (every second), all Supabase query results, every PostHog event, and all API responses generates 10,000+ events per user per day. This creates unpredictable costs (Axiom charges per GB), makes logs unsearchable, and overwhelms the observability platform.

**Why it happens:**
Replacing console.error with logger.error maintains 1:1 ratio, but structured logging encourages more context, expanding log volume 3-5x. Timer context updates every second (client-side). Supabase RPC calls return large result sets that get logged. No sampling strategy or log-level discipline.

**How to avoid:**
- Implement log sampling: 10% of INFO logs, 100% of ERROR logs
- Never log timer tick updates (every second) - only state transitions (start/stop/pause)
- For Supabase: log query name and row count, not full result sets
- Use log levels correctly: DEBUG (never in production), INFO (sampled 10%), WARN (always), ERROR (always)
- Configure Axiom dataset limits: alert at 5GB/month, hard cap at 10GB
- Monitor log volume per service: if cron.service.ts dominates, investigate
- Batch logs: buffer 100 events before sending to Axiom, reducing API calls 100x

**Warning signs:**
- Axiom costs exceeding $100/month (10GB+ at $10/GB)
- Log search timing out due to volume
- Timer-related logs appearing every second in production
- Supabase RPC result arrays with 1000+ items in logs
- Axiom ingestion rate alerts triggering
- More than 1000 events per user per day

**Phase to address:**
Phase 1 (Foundation) - Set up sampling and log-level discipline before instrumenting services. Phase 3 (Cost Controls) - Add volume monitoring and adaptive sampling.

---

## Moderate Pitfalls

### Pitfall 7: TypeScript Type Safety Issues with Axiom

**What goes wrong:**
Using `req.log` in Next.js API routes fails TypeScript compilation because NextApiRequest doesn't have a log property. This creates type assertion workarounds, bypassing type safety and leading to runtime errors.

**Prevention:**
- Import AxiomAPIRequest from next-axiom and use type guards
- Create typed logger wrapper that doesn't pollute request objects
- For App Router (route.ts files): use standalone logger, not req.log
- Define LoggerContext interface with required fields (userId, traceId, etc.)
- Use module augmentation to extend NextRequest type if req.log pattern is required

**Phase to address:** Phase 1 (Foundation) - Establish type-safe logging patterns before service instrumentation.

---

### Pitfall 8: PostHog Hydration Mismatches in App Router

**What goes wrong:**
Initializing PostHog in root layout with "use client" causes React hydration warnings. PostHog needs to read browser state (localStorage for anonymous IDs) which differs between server and client rendering.

**Prevention:**
- Use PostHog PageView component with Suspense boundaries
- Initialize PostHog only after client-side mount with useEffect
- Don't call posthog.capture during server-side rendering
- Create separate PostHogProvider component with "use client" directive
- For App Router: wrap only the provider, keep page components as Server Components
- Test for hydration warnings in browser console during development

**Phase to address:** Phase 1 (Foundation) - Set up PostHog provider correctly before adding any analytics events.

---

### Pitfall 9: Rate Limiter and Logging Middleware Conflicts

**What goes wrong:**
BillMint has existing rate limiting on public invoice routes. Adding logging middleware creates multiple middleware layers that can interfere with each other, skip rate limit checks, or cause double-execution.

**Prevention:**
- Use Next.js middleware matcher to separate logging from rate limiting routes
- For `/api/invoices/public/*`: rate limit runs first, logging runs second
- Ensure middleware composition order: auth → rate limit → logging
- Test that rate-limited requests still get logged (but after limit check)
- Don't log rate limit bypass attempts (creates log spam attack vector)
- Current middleware config already excludes webhooks - maintain this pattern

**Phase to address:** Phase 2 (Service Instrumentation) - When adding logging middleware, carefully test interaction with existing rate limiter.

---

### Pitfall 10: Cron Job Logging Without Execution Tracking

**What goes wrong:**
The timer auto-pause cron job runs every 15 minutes. Without proper logging, you can't tell if it ran, how many timers it paused, or why it failed. But over-logging creates noise (96 executions/day).

**Prevention:**
- Log only cron start, completion, and errors (not every iteration)
- Include execution summary: timers checked, timers paused, errors encountered
- Use structured fields: { cronJob: 'timer-auto-pause', timersChecked: 42, timersPaused: 3 }
- If zero timers paused: log at DEBUG level, if >0 paused: log at INFO level
- For failures: log ERROR with retry count and next execution time
- Use Sentry's cron monitoring (withMonitor) to track execution cadence
- Alert if cron doesn't run for 30+ minutes (missed execution)

**Phase to address:** Phase 2 (Service Instrumentation) - Add structured logging to cron.service.ts with execution summaries.

---

### Pitfall 11: Email Service Logging Missing Delivery Status

**What goes wrong:**
Resend's email service logs "email sent" but doesn't track delivery status. Email might bounce, get spam-filtered, or fail to send, but logs show success. Debugging "user didn't receive invoice" becomes impossible.

**Prevention:**
- Log Resend's message ID from send response: `{ emailId: result.id }`
- Don't log email content (PII risk), log metadata: recipient domain, template name, size
- For invoice emails: log invoice ID, recipient count, and email type
- Use Resend webhooks to log delivery status (delivered/bounced/complained)
- If Resend API call succeeds but email bounces later, no immediate log - add webhook handler
- Track email success rate: alert if <95% delivery rate

**Phase to address:** Phase 2 (Service Instrumentation) - Add delivery tracking to email.service.ts. Phase 4 (Advanced Features) - Add Resend webhook handler for delivery status.

---

### Pitfall 12: Anonymous PostHog Tracking Creates User Journey Gaps

**What goes wrong:**
BillMint's requirement: "PostHog will be anonymous only (no user identification)". This means when a user signs up, their pre-auth journey (landing page views, feature clicks) can't be linked to their post-auth behavior (creating timers, generating invoices).

**Prevention:**
- Accept this as an intentional privacy tradeoff, not a mistake
- Use PostHog's alias() function to link anonymous → authenticated sessions if requirements change
- Track aggregate metrics: "% of anonymous users who sign up" vs individual user journeys
- For A/B tests: use anonymous cohorts, not individual user tracking
- Document that conversion funnels will have gaps at signup boundary
- If user identification becomes required: use opaque user IDs (UUID), never email addresses

**Phase to address:** Phase 1 (Foundation) - Document privacy constraints in PostHog config. If requirements change, Phase 4 (Advanced Features) adds identity resolution.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Logging full error objects without sanitization | Faster initial implementation, all context available | PII exposure, GDPR violations, security incidents, compliance fines | Never - always sanitize |
| Synchronous logging in API routes | Simple code, guaranteed delivery | Slow response times, timeouts, poor UX, failed requests | Never in webhooks, acceptable in admin-only routes |
| Skipping trace ID propagation | No refactoring required, faster setup | Impossible to correlate logs, debugging takes 10x longer | Acceptable for MVP if only one service, unacceptable for BillMint's 14 services |
| No log sampling (log everything) | Complete visibility, nothing missed | Unpredictable costs, slow log search, signal-to-noise problems | Acceptable first 2 weeks of production (learning phase), then add sampling |
| Console.log instead of structured logging | Zero setup time, familiar API | No search/filter, no alerting, no structure, can't aggregate | Only in pure development, never commit to production |
| Client-side only PostHog (no server events) | Simple setup, no SSR complexity | Miss server-side conversions (API-driven actions), incomplete funnels | Acceptable if all user actions are UI-driven, not for BillMint (has API-first workflows) |
| Logging to console in edge middleware | Works in development, fast | No persistence in production (edge logs are ephemeral), can't debug edge issues | Never - edge middleware must use persistent logging |
| No cost monitoring (pay-as-you-go blind) | No upfront effort, simple | Surprise bills, no budget control, reactive cost management | Only acceptable first month, then add alerts |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Axiom + Next.js App Router | Using Pages Router API (withAxiom wrapper) in App Router route.ts files | Use standalone logger in route handlers, not req.log pattern |
| PostHog + SSR | Calling posthog.capture() in Server Components | Only use PostHog in "use client" components or after useEffect mount |
| Supabase RPC + Logging | Logging query results with user data | Log query name, row count, execution time - never full rows |
| Stripe Webhooks + Axiom | Awaiting logger.flush() before responding to webhook | Fire-and-forget logging, respond immediately, flush async |
| Timer Context + Analytics | Logging every timer tick (every second) to PostHog | Only log state transitions: start/stop/pause/resume events |
| Middleware + Auth | Logging before auth check exposes pre-auth request data | Run auth check first, then log with userId context |
| Resend + Error Tracking | Logging email.send() success as "email delivered" | Email sent ≠ delivered; track Resend webhooks for actual delivery |
| Next.js Edge Runtime + Axiom | Using Node.js-specific Axiom features in edge functions | Use edge-compatible @axiomhq/js (not next-axiom) for edge middleware |
| Cron Jobs + Sentry | Assuming Sentry auto-detects cron executions | Manually wrap cron functions with Sentry.withMonitor() |
| OpenTelemetry + Axiom | Assuming Axiom auto-receives OTEL traces | Axiom needs manual OTEL exporter config, not automatic |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Logging in hot loops (timer tick) | CPU spikes, UI jank, battery drain on mobile | Only log state changes, not every render/tick | Immediately - 1 log/second per user = 86,400 logs/day per user |
| Awaiting log flush in request handlers | API routes timeout, 500 errors under load | Use async fire-and-forget logging, batch flushes | At 10+ concurrent requests or high network latency to Axiom |
| Logging large Supabase result sets | Memory bloat, JSON.stringify slowdowns, log truncation | Log metadata (row count, query name), not full rows | When query returns >100 rows or >1MB data |
| Synchronous PostHog identify/capture | Page render blocking, slow TTI (Time to Interactive) | Defer PostHog calls with setTimeout or requestIdleCallback | On slower devices or 3G networks - 200ms+ blocking time |
| No log batching (send every event) | API rate limits, connection overhead, cost inflation | Buffer 100 events or 5 seconds before sending | At >1000 events/minute or poor network conditions |
| Middleware logging on static assets | 1000s of logs for images/fonts, wasted budget | Use matcher to exclude `_next/static`, images, favicons | Immediately - static assets called on every page load |
| Structured logging without lazy evaluation | Expensive serialization even when log level prevents output | Use function args: `logger.debug(() => expensiveSerialize())` | When DEBUG logs remain in production and objects are complex |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Logging full Stripe webhook payload | Credit card numbers, PII in logs, compliance violation | Log only event.type, event.id, customer.id - never payment_method details |
| Including session tokens in error context | Session hijacking if logs compromised | Strip Authorization headers and cookies before logging |
| Logging Supabase anon key | Exposes database access, allows unauthorized queries | Never log env vars or service keys; if logged, rotate immediately |
| Verbose logging of auth failures | Enumeration attacks (leaks valid user emails) | Log "auth failed" + attempt count, not "user X doesn't exist" |
| Putting user passwords in error messages | Catastrophic PII exposure if exception includes input | Sanitize all user input before logging, never log form fields |
| Unencrypted log transmission to Axiom | Man-in-the-middle attacks on log data | Verify Axiom SDK uses HTTPS, check TLS version in transport config |
| Publicly accessible log endpoints | Anyone can read production logs | Never expose Axiom/PostHog dashboards publicly, use SSO/OAuth |
| Logging API responses from external services | Third-party PII in your logs (data processor liability) | Log only status codes and timing from external APIs, not response bodies |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Blocking UI on PostHog capture | Button clicks feel laggy, form submissions slow | Fire-and-forget analytics, never await capture() |
| Logging errors without user-facing messages | User sees "something went wrong", can't get help | Log trace ID, show it to user: "Error XY123 - contact support" |
| Silent failures when logging breaks | Issues go undetected, users report same bugs repeatedly | Add fallback error handler for logger itself, alert on logger crashes |
| No correlation between user reports and logs | Support team can't find logs for user's issue | Log user ID (or anonymous ID) in every event, give users "Copy Debug Info" button |
| Excessive logging slowing page load | Pages load slowly, high bounce rate | Defer non-critical logging until after page interactive |
| Timer lag due to logging overhead | Timer feels unresponsive, poor UX for core feature | Never log timer tick updates, use optimistic UI updates |
| Analytics tracking interfering with navigation | Clicks on links delayed by PostHog event capture | Use posthog.capture() with no await, let browser navigate immediately |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces:

- [ ] **Axiom Integration:** Often missing production-only checks — verify `NODE_ENV === 'production'` guards all logging
- [ ] **PostHog Setup:** Often missing anonymous ID persistence — verify localStorage strategy for cross-session tracking
- [ ] **Error Logging:** Often missing PII sanitization — verify no email/phone/payment data in error context
- [ ] **Webhook Logging:** Often missing async batching — verify webhook responds <3 seconds under logging load
- [ ] **Middleware Logging:** Often missing trace ID generation — verify trace_id present in all downstream logs
- [ ] **Service Instrumentation:** Often missing circular reference protection — verify JSON.stringify doesn't crash on errors
- [ ] **Cron Job Logging:** Often missing execution summaries — verify "timers paused" count logged, not just "ran successfully"
- [ ] **Timer Context:** Often missing client-server correlation — verify timer events include trace ID for server-side lookup
- [ ] **Cost Monitoring:** Often missing volume alerts — verify Axiom/PostHog budgets configured with 80% threshold alerts
- [ ] **Log Sampling:** Often missing ERROR exemption — verify sampling only applies to INFO/DEBUG, never ERROR/WARN
- [ ] **Supabase Queries:** Often missing query name in logs — verify can identify which RPC call failed from log alone
- [ ] **Email Logging:** Often missing Resend message ID — verify can correlate email send with delivery status later

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover:

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| PII leaked in logs | HIGH | 1. Delete logs containing PII from Axiom (GDPR Right to Erasure), 2. Rotate any exposed API keys/tokens, 3. Notify affected users if required by law, 4. Add sanitization to prevent recurrence, 5. Audit all log statements for similar issues |
| Log volume explosion | MEDIUM | 1. Enable aggressive sampling (1% INFO logs) immediately, 2. Identify top volume sources with Axiom dataset analytics, 3. Add rate limiting to highest-volume loggers, 4. Consider downgrading Axiom tier temporarily, 5. Review and remove noisy log statements |
| Circular reference crashes | LOW | 1. Add global error handler for JSON serialization failures, 2. Create object sanitizer that recursively removes circular refs, 3. Use flatted library as emergency serializer, 4. Audit recent changes for raw object logging |
| Webhook timeouts | HIGH | 1. Immediately disable synchronous logging in webhook handler, 2. Switch to fire-and-forget pattern, 3. Check Stripe dashboard for failed webhooks and manually reconcile, 4. Monitor webhook response times for 24 hours, 5. Add timeout guards (reject logging if >2 seconds elapsed) |
| Missing trace correlation | MEDIUM | 1. Add trace ID to middleware retroactively, 2. Redeploy, 3. Accept that pre-fix logs are uncorrelated (can't fix historical data), 4. Create runbook for manual correlation using timestamps, 5. Add trace ID to all new log statements going forward |
| Development data pollution | LOW | 1. Delete Axiom dataset and PostHog project (start fresh), 2. Add NODE_ENV checks to all logging/analytics, 3. Test production build locally before deploying, 4. Set up separate "staging" Axiom dataset for pre-prod testing |
| PostHog hydration warnings | LOW | 1. Move PostHog init to useEffect, 2. Clear browser cache to reset state, 3. Test SSR vs CSR rendering in production, 4. Add Suspense boundary around PostHog provider, 5. Verify no SSR calls to PostHog |
| Excessive logging costs | MEDIUM | 1. Immediately reduce sampling rate (10% → 1%), 2. Identify and remove highest-volume log sources, 3. Switch Axiom plan if already on highest tier, 4. Export and delete old logs to reduce storage costs, 5. Add budget alerts at 50%/80%/100% |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls:

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Logging sensitive data (PII) | Phase 1: Foundation | Run Axiom query for regex patterns (email/phone/SSN), expect zero results |
| Circular reference crashes | Phase 1: Foundation | Test logging Request/Error objects, verify no crashes in error handler |
| Development data pollution | Phase 1: Foundation | Deploy to production, verify Axiom shows zero localhost traffic |
| Webhook timeout | Phase 2: Service Instrumentation | Stripe webhook test mode, verify response <3 seconds under logging |
| Missing trace correlation | Phase 1: Foundation | Generate error in nested call, verify logs from all layers share trace ID |
| Log volume explosion | Phase 3: Cost & Performance | Check Axiom daily ingestion, verify <100MB/day baseline |
| TypeScript type safety | Phase 1: Foundation | Compile with strict mode, zero type assertions around logger |
| PostHog hydration mismatch | Phase 1: Foundation | Load app in React DevTools, verify no hydration warnings in console |
| Rate limiter conflicts | Phase 2: Service Instrumentation | Test rate-limited route, verify both rate limit and logging execute |
| Cron job logging gaps | Phase 2: Service Instrumentation | Wait for cron execution, verify Axiom shows execution summary log |
| Email delivery blindness | Phase 2: Service Instrumentation | Send test invoice, verify Resend message ID in logs, check delivery status |
| Anonymous tracking gaps | Phase 1: Foundation | Document in PostHog config, accept as privacy tradeoff |

---

## Sources

**Axiom Integration & Next.js:**
- [Axiom Next.js Documentation](https://axiom.co/docs/send-data/nextjs) (HIGH confidence)
- [GitHub: axiomhq/next-axiom](https://github.com/axiomhq/next-axiom) (HIGH confidence)
- [Axiom's new JS logging libraries](https://axiom.co/blog/new-js-logging) (HIGH confidence)
- [Axiom Next.js API Routes logging](https://www.imakewebsites.ca/posts/axiom-logging-nextjs-api-routes/) (MEDIUM confidence)
- [GitHub Issue: API resolved without sending response with intermediate logger](https://github.com/axiomhq/next-axiom/issues/119) (HIGH confidence - documented issue)

**PostHog Integration & Next.js:**
- [Using PostHog with Next.js App Router and Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics) (HIGH confidence)
- [Integrating PostHog with Next.js](https://medium.com/@tejasbhovad/integrating-posthog-with-nextjs-92c01182334e) (MEDIUM confidence)
- [PostHog Next.js setup feedback (GitHub Issue)](https://github.com/PostHog/posthog-js/issues/1461) (HIGH confidence - real user feedback)
- [GDPR compliant PostHog tracking without consent](https://www.psimms.de/posts/gdpr-compliant-posthog-tracking-without-consent/) (MEDIUM confidence)

**Next.js Observability & Performance:**
- [Monitor Next.js with OpenTelemetry (SigNoz)](https://signoz.io/blog/opentelemetry-nextjs/) (HIGH confidence)
- [20 Essential Monitoring Tools for Next.js in 2025](https://joodi.medium.com/20-essential-monitoring-tools-for-next-js-in-2025-edba6621128c) (MEDIUM confidence)
- [Next.js Observability: The OpenTelemetry Case Study](https://medium.com/ekino-france/next-js-observability-the-opentelemetry-case-study-92a687a69a3d) (MEDIUM confidence)

**Structured Logging Best Practices:**
- [Structured logging for Next.js (Arcjet)](https://blog.arcjet.com/structured-logging-in-json-for-next-js/) (HIGH confidence)
- [Next.js Logging Best Practices: Structured Logs vs Console.log](https://prateeksha.com/blog/nextjs-logging-best-practices-structured-logs-production) (MEDIUM confidence)
- [Next.js logging configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging) (HIGH confidence - official docs)

**Sensitive Data & PII:**
- [Scrubbing Sensitive Data (Sentry for Next.js)](https://docs.sentry.io/platforms/javascript/guides/nextjs/data-management/sensitive-data/) (HIGH confidence)
- [Best Logging Practices for Safeguarding Sensitive Data (Better Stack)](https://betterstack.com/community/guides/logging/sensitive-data/) (HIGH confidence)
- [How to Think About Security in Next.js](https://nextjs.org/blog/security-nextjs-server-components-actions) (HIGH confidence - official blog)

**Stripe Webhook Best Practices:**
- [Stripe Webhooks Implementation Guide (Hooklistener 2025)](https://www.hooklistener.com/learn/stripe-webhooks-implementation) (MEDIUM confidence)
- [Logging and Monitoring Stripe Webhook Events](https://moldstud.com/articles/p-how-to-effectively-log-and-monitor-stripe-webhook-events-for-better-performance) (MEDIUM confidence)
- [Stripe Error Handling Documentation](https://docs.stripe.com/error-handling) (HIGH confidence - official docs)

**Cron Job Monitoring:**
- [Set Up Crons (Sentry for Next.js)](https://docs.sentry.io/platforms/javascript/guides/nextjs/crons/) (HIGH confidence)
- [Next.js Cron Jobs - Schedule Tasks in Next.js Apps](https://www.cronuptime.com/nextjs-cron-jobs) (MEDIUM confidence)

**Supabase & Observability:**
- [New Observability Features in Supabase](https://supabase.com/blog/new-observability-features-in-supabase) (HIGH confidence)
- [Supabase Logging Documentation](https://supabase.com/docs/guides/telemetry/logs) (HIGH confidence)

**Circular References & JSON Serialization:**
- [TypeError: Converting Circular Structure to JSON (GeeksforGeeks)](https://www.geeksforgeeks.org/javascript/what-is-typeerror-converting-circular-structure-to-json/) (MEDIUM confidence)
- [Next.js Issue #85244: Circular structure after migration to Next 16](https://github.com/vercel/next.js/issues/85244) (HIGH confidence)
- [Next.js: Circular references cannot be expressed in JSON](https://nextjs.org/docs/messages/circular-structure) (HIGH confidence - official docs)

**Distributed Tracing & Context Propagation:**
- [Set Up Distributed Tracing (Sentry for Next.js)](https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/distributed-tracing/) (HIGH confidence)
- [Tracing Distributed Systems in Next.js](https://errors.highlight.io/blog/tracing-distributed-systems-in-nextjs) (MEDIUM confidence)

**Cost Management:**
- [Managing observability costs at scale (Grafana Cloud 2025)](https://grafana.com/blog/2025/10/14/managing-observability-costs-at-scale-a-look-at-the-latest-cost-management-features-in-grafana-cloud/) (HIGH confidence)
- [Axiom Pricing](https://axiom.co/pricing) (HIGH confidence)
- [PostHog Pricing Breakdown (LiveSession)](https://livesession.io/blog/posthog-pricing-breakdown-how-much-does-posthog-cost) (MEDIUM confidence)

**Log Sampling:**
- [Log Sampling (.NET Microsoft)](https://learn.microsoft.com/en-us/dotnet/core/extensions/log-sampling) (HIGH confidence - patterns apply cross-platform)
- [How to Reduce Logging Costs with Log Sampling (Better Stack)](https://betterstack.com/community/guides/logging/log-sampling/) (HIGH confidence)
- [Log Sampling: Techniques, Challenges & Best Practices (groundcover)](https://www.groundcover.com/learn/logging/log-sampling) (MEDIUM confidence)

**Edge Runtime & Middleware:**
- [Next.js Edge and Node.js Runtimes](https://nextjs.org/docs/14/app/building-your-application/rendering/edge-and-nodejs-runtimes) (HIGH confidence - official docs)
- [Next.js Edge Runtime API Reference](https://nextjs.org/docs/app/api-reference/edge) (HIGH confidence - official docs)
- [How to Fix "Edge Runtime" Limitations in Next.js](https://oneuptime.com/blog/post/2026-01-24-fix-nextjs-edge-runtime-limitations/view) (MEDIUM confidence)

**React Context & State:**
- [Pitfalls of overusing React Context (LogRocket)](https://blog.logrocket.com/pitfalls-of-overusing-react-context/) (HIGH confidence)
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025) (MEDIUM confidence)

---

*Pitfalls research for: Observability & Analytics Integration (Axiom + PostHog)*
*Researched: 2026-02-11*
*BillMint context: 14 services, 124+ console.error calls, Next.js 16 App Router, Supabase RPC, Stripe webhooks, Resend emails, cron jobs, production-only requirement*
