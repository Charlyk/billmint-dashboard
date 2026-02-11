# Codebase Concerns

**Analysis Date:** 2026-02-11

## Tech Debt

**RPC Type Safety Suppressions:**
- Issue: Multiple service files use `eslint-disable @typescript-eslint/no-explicit-any` and `(supabase.rpc as any)` to bypass type checking on RPC calls. This defeats TypeScript safety for a significant portion of backend-database communication.
- Files: `src/lib/services/invoice.service.ts`, `src/lib/services/time-entry.service.ts`, `src/lib/services/client.service.ts`, `src/lib/services/billing.service.ts`, `src/lib/services/user.service.ts`, `src/lib/services/timer.service.ts`
- Impact: Silent failures if RPC response structure changes; impossible to catch data type mismatches at compile time. Any Supabase RPC function signature change could break production without warning.
- Fix approach: Generate proper TypeScript types for all Supabase RPC functions using Supabase's type generation tools or create manual type definitions for each RPC function signature. Example: Instead of `(supabase.rpc as any)('get_invoice_with_details', params)`, type the response as `{ data: InvoiceWithDetails | null; error: Error | null }` in the function signature.

**Large Component Files:**
- Issue: Several dashboard pages exceed 1500 lines and contain mixed responsibilities
- Files: `src/app/dashboard/time-entries/page.tsx` (1593 lines), `src/app/dashboard/settings/page.tsx` (893 lines), `src/app/dashboard/invoices/page.tsx` (655 lines), `src/app/dashboard/invoices/new/page.tsx` (554 lines)
- Impact: Difficult to test, maintain, and reason about state management. `time-entries/page.tsx` has 11+ state variables and handles filtering, bulk operations, modals, and invoice creation all in one component.
- Fix approach: Extract form logic, filtering logic, and modal handling into separate custom hooks or compound components. Move business logic to service layer. Use `useCallback` and `useMemo` to prevent unnecessary re-renders with deep state.

**Email Service Lazy Initialization with Missing Error Handling:**
- Issue: `src/lib/services/email.service.ts` initializes Resend client lazily but throws only at first call if `RESEND_API_KEY` is missing. If email sending fails mid-flight, no fallback or queue mechanism exists.
- Files: `src/lib/services/email.service.ts` (lines 1-15)
- Impact: Email sending failures are silent in many code paths (e.g., `sendVerificationEmail` in `src/lib/services/auth.service.ts:85` uses `.catch()` without retry). Users may not receive critical emails like password resets or invoice notifications.
- Fix approach: Implement retry logic with exponential backoff for failed email sends. Add monitoring/alerting for failed email operations. Consider queue-based email delivery (e.g., Bull, Inngest) for async resilience.

**Stripe Instance Lazy Initialization Not Re-instantiated:**
- Issue: `src/lib/services/billing.service.ts` creates Stripe singleton but never validates if `STRIPE_SECRET_KEY` changes or is null at runtime.
- Files: `src/lib/services/billing.service.ts` (lines 8-21)
- Impact: If secret key is rotated or missing, singleton will be stale until server restart. No mechanism to refresh client.
- Fix approach: Add validation on each Stripe call or implement a refresh mechanism. Store API version as constant to prevent API drift.

**Inconsistent Error Logging Patterns:**
- Issue: Some services log errors to console while others silently fail. No centralized error tracking or alerting.
- Files: Scattered `console.error()` calls in 35+ files
- Impact: Difficult to diagnose production issues. No error aggregation or alerting for operators.
- Fix approach: Replace all `console.error()` with structured logging. Integrate error tracking service (Sentry, LogRocket, etc.) to capture and alert on errors.

## Known Bugs

**Invoice Number Generation Uses Math.random():**
- Symptoms: `generateInvoiceNumber()` in `src/app/dashboard/time-entries/page.tsx:91` uses `Math.random() * 9000 + 1000` which can produce duplicate invoice numbers across users or sessions. No uniqueness guarantee.
- Files: `src/app/dashboard/time-entries/page.tsx` (lines 87-93)
- Trigger: Create multiple invoices in rapid succession or across multiple sessions
- Workaround: Manually edit invoice number before saving. Use server-side sequence generation instead.

**Timer Auto-Pause Not Preventing Further Time Accumulation:**
- Symptoms: Timer context shows warning if `response.autoPaused` is true, but doesn't prevent user from resuming paused timer, allowing them to accumulate more time beyond the max_timer_hours limit.
- Files: `src/contexts/timer-context.tsx` (lines 161-168)
- Trigger: Auto-pause triggers, user resumes timer
- Workaround: Stop timer immediately or manually adjust time entry. Better fix: Don't allow resume of auto-paused timers; force manual creation of new entry.

**Missing Null Checks in Email Operations:**
- Symptoms: `sendVerificationEmail()` in `src/lib/services/auth.service.ts:85` swallows all errors in `.catch()` without checking if email was actually sent.
- Files: `src/lib/services/auth.service.ts` (lines 85-87)
- Trigger: Network failure during email send, Resend API unreachable
- Workaround: Manually send verification email or use alternative method
- Impact: User can sign up but never verify email, creating orphaned account

**Date Parsing with Timezone Edge Cases:**
- Symptoms: `groupEntriesByDate()` in `src/app/dashboard/time-entries/page.tsx:150` uses `toLocaleDateString()` which can produce wrong dates around midnight in different timezones.
- Files: `src/app/dashboard/time-entries/page.tsx` (lines 150-170)
- Trigger: Time entries near midnight in UTC-X timezones
- Workaround: None visible; behavior is silent

## Security Considerations

**Stripe Webhook Signature Validation Missing Rotation:**
- Risk: `STRIPE_WEBHOOK_SECRET` is checked once at app startup but never rotated or re-validated if webhook signing secrets are updated.
- Files: `src/lib/services/billing.service.ts` (lines 172-180)
- Current mitigation: Stripe validates webhook signature; malicious payloads are rejected.
- Recommendations: Implement webhook secret rotation mechanism. Log all webhook validation failures. Consider storing multiple valid secrets during rotation window.

**Public Invoice Routes Have No Rate Limiting:**
- Risk: `src/app/api/invoices/public/[token]/route.ts` and PDF endpoint accept public tokens with no rate limiting, enabling brute force or DoS attacks.
- Files: `src/app/api/invoices/public/[token]/route.ts`, `src/app/api/invoices/public/[token]/pdf/route.ts`
- Current mitigation: Token is UUID-based (hard to guess), but 32 requests/second to `/api/invoices/public/*/pdf` could consume resources.
- Recommendations: Add IP-based rate limiting. Implement token expiration or one-time use tokens. Log all public invoice access.

**User Settings API Updates Not Validating All Fields:**
- Risk: `src/lib/services/user.service.ts` `updateUserSettings()` accepts partial updates without schema validation, potentially allowing injection of unexpected fields.
- Files: `src/lib/services/user.service.ts` (lines 72-104)
- Current mitigation: Uses `as never` to suppress type errors, but fields are passed directly to RPC.
- Recommendations: Add Zod schema validation for all updateUserSettings inputs before RPC call. Whitelist allowed fields explicitly.

**Unencrypted Sensitive Data in localStorage:**
- Risk: `src/lib/hooks/use-timer.ts` stores timer state in localStorage including description and project ID, which could be sensitive.
- Files: `src/lib/hooks/use-timer.ts` (lines 24-30)
- Current mitigation: localStorage is client-side only, not transmitted.
- Recommendations: Don't store sensitive user content in localStorage. Store only public state like timer duration. Encrypt if necessary.

**Email Addresses Logged Without Redaction:**
- Risk: `console.error()` calls log full email addresses in auth and billing services.
- Files: `src/lib/services/auth.service.ts`, `src/lib/services/email.service.ts`, `src/lib/services/billing.service.ts`
- Current mitigation: None; development/production logs will contain PII.
- Recommendations: Redact email addresses in all logs. Use structured logging with field masking.

## Performance Bottlenecks

**Time Entries Page Renders All Entries Without Virtualization:**
- Problem: `src/app/dashboard/time-entries/page.tsx` renders full list of time entries (potentially 100+) without virtualization. Each entry triggers React DOM operations.
- Files: `src/app/dashboard/time-entries/page.tsx` (rendering from line 1400+)
- Cause: Large DOM tree from grouped date sections + multiple entries per date + dropdown menus
- Improvement path: Implement windowing/virtualization using `react-window` for large lists. Lazy-load entry details. Paginate instead of loading all entries.

**Settings Page Has 6 Separate Fetch Operations:**
- Problem: `src/app/dashboard/settings/page.tsx` fetches subscription data, Stripe invoices, user settings, and billing info in parallel but without caching strategy. Every mount triggers 6 requests.
- Files: `src/app/dashboard/settings/page.tsx`
- Cause: No SWR/React Query caching; each page load = 6 round trips
- Improvement path: Use SWR with global cache configuration. Implement stale-while-revalidate pattern. Consider pre-fetching on dashboard.

**Invoice PDF Generation Happens Synchronously:**
- Problem: `src/app/api/invoices/[id]/pdf/route.ts` generates PDF on every request without caching. Large PDFs could block API response for 2-5 seconds.
- Files: `src/app/api/invoices/[id]/pdf/route.ts`
- Cause: PDF rendered from template on each request using `@react-pdf/renderer`
- Improvement path: Cache generated PDFs with etag. Implement background job queue for PDF generation. Use React PDF streaming if available.

**Timer Context Stores Full Object in localStorage:**
- Problem: `src/lib/hooks/use-timer.ts` serializes/deserializes entire timer object on every change, but only uses a few fields. JSON.parse/stringify on every update.
- Files: `src/lib/hooks/use-timer.ts` (lines 24-30)
- Cause: Full state serialization without selective storage
- Improvement path: Only store minimal data (duration, startTime). Fetch timer state from server on mount instead of relying on localStorage.

**Email Service Builds HTML Templates as Strings:**
- Problem: `src/lib/services/email.service.ts` has 1000+ lines of inline HTML strings (1056 lines total). No template engine, no reuse.
- Files: `src/lib/services/email.service.ts`
- Cause: Inline HTML strings make the file massive and hard to maintain. Building new emails adds proportional file size.
- Improvement path: Move to template language (e.g., Handlebars, MJML) with separate files. Precompile templates. Use Resend template IDs instead of raw HTML.

## Fragile Areas

**Timer Context Synchronization Between Client and Server:**
- Files: `src/contexts/timer-context.tsx`
- Why fragile: Maintains dual state (client-side elapsed time + server state). If network fails during stop/sync, state can diverge. Timer thread can accumulate time locally while server thinks it's paused.
- Safe modification: Any changes to timer state logic must consider offline scenarios. Add conflict resolution when syncing. Test with simulated network failures.
- Test coverage: No tests for timer context; no offline scenarios tested. Missing: pause -> disconnect -> resume -> reconnect behavior.

**Supabase RPC Error Handling:**
- Files: `src/lib/services/invoice.service.ts`, `src/lib/services/time-entry.service.ts`, `src/lib/services/client.service.ts`, `src/lib/services/billing.service.ts`
- Why fragile: Error handling checks `error.message?.includes()` pattern which is brittle. If Supabase changes error message format, error detection breaks silently.
- Safe modification: Parse error codes instead of message text. Create error type definitions for each RPC function's possible errors.
- Test coverage: No error scenario tests; all success paths have tests but RPC failures are uncovered.

**Invoice Creation Bulk Operation:**
- Files: `src/app/dashboard/time-entries/page.tsx` (lines 1000-1100+), `src/lib/api/time-entries.ts`
- Why fragile: Bulk invoice creation from time entries with modal state and client selection. If network fails mid-operation, UI state and database state can become inconsistent.
- Safe modification: Implement optimistic updates with rollback. Add idempotency key for bulk operations. Show clear error states without silent failures.
- Test coverage: No tests for bulk operations; no network failure scenarios. Missing: partial success handling (some entries invoiced, some failed).

**Authentication State Across Contexts:**
- Files: `src/contexts/auth-context.tsx`, `src/middleware.ts`, `src/lib/supabase/middleware.ts`
- Why fragile: Multiple sources of truth for auth state (Auth context, middleware cookies, Supabase session). Logout in one context doesn't guarantee cleanup in others.
- Safe modification: Audit all auth state flows. Ensure logout clears all caches (SWR, localStorage, cookies). Test session expiration scenarios.
- Test coverage: No tests for auth state transitions; missing: logout → redirect → login flow verification.

## Test Coverage Gaps

**Zero Unit Tests:**
- What's not tested: Entire service layer has no unit tests. No tests for error handling, edge cases, or business logic.
- Files: `src/lib/services/*.ts` (14 files with zero tests)
- Risk: Refactoring billing logic, invoice calculations, or timer logic could introduce bugs undetected until production.
- Priority: High — Billing and timer logic are business-critical

**No Integration Tests:**
- What's not tested: Timer start → pause → resume → stop flow; Invoice creation from time entries; Subscription upgrade flow
- Files: `src/contexts/timer-context.tsx`, `src/lib/services/invoice.service.ts`, `src/lib/services/billing.service.ts`
- Risk: Complex multi-step operations fail silently in production. Critical user workflows untested.
- Priority: High

**No E2E Tests:**
- What's not tested: Full user journeys (signup → create project → start timer → create invoice → pay). No Stripe webhook testing.
- Files: All features
- Risk: UI changes break backend communication undetected. Stripe integration regressions go unnoticed.
- Priority: Medium

**No Tests for Public API Routes:**
- What's not tested: Public invoice endpoint security, PDF generation, token validation
- Files: `src/app/api/invoices/public/[token]/route.ts`
- Risk: XSS vulnerabilities, missing authentication, or token brute-force attacks in public routes
- Priority: High

## Scaling Limits

**RPC Pagination Default to 20 Items:**
- Current capacity: All list endpoints default to `limit: 20` results per page
- Limit: Users with 500+ invoices, time entries, or clients will experience slow UI and multiple page loads
- Scaling path: Implement cursor-based pagination for large datasets. Increase default limit to 50-100. Add "load more" pattern. Cache list results with SWR.

**Email Service Single Connection:**
- Current capacity: Resend API single instance; no queuing
- Limit: Burst sends (e.g., weekly summary emails to 1000 users) will queue in-memory and risk OOM or losses if server crashes
- Scaling path: Implement job queue (Bull, Inngest, Firebase Cloud Tasks). Batch email sends. Rate limit to Resend's limits (probably 100+ req/sec already).

**PDF Generation Synchronous:**
- Current capacity: One request blocks until PDF rendered (2-5 sec per invoice)
- Limit: 100 concurrent users requesting PDF = 200-500 sec queue time
- Scaling path: Move PDF generation to background queue. Cache generated PDFs. Use streaming responses.

**Timer Sync Using Direct DB Updates:**
- Current capacity: All timer updates go directly to Supabase; no batching
- Limit: High-frequency timer syncs (every 10 seconds) create database write pressure
- Scaling path: Batch timer updates. Use websocket subscriptions instead of polling. Implement local-first sync.

## Dependencies at Risk

**@react-pdf/renderer Version Pinned to ^4.3.2:**
- Risk: Package is actively maintained but has known performance issues with large PDFs. Next major version might have breaking changes.
- Impact: PDF generation degrades with complex invoices; can block server responses.
- Migration plan: Monitor updates to v5.x. Consider alternative: Use headless Chrome (Puppeteer) for better performance and compatibility.

**Stripe API Version Hardcoded to 2026-01-28.clover:**
- Risk: Custom API version (not standard) may be a typo or internal Stripe version. If removed, client will error.
- Impact: Build-time or runtime error if Stripe removes this version
- Migration plan: Use standard Stripe API version (e.g., 2024-12-18). Verify version exists and is maintained.

**Supabase @supabase/ssr ^0.8.0:**
- Risk: Middleware integration is fragile and version-specific. Breaking changes in 0.9.0 or 1.0.0 likely.
- Impact: Auth middleware could fail silently or require major refactor
- Migration plan: Pin to latest 0.8.x until 1.0 is available. Plan upgrade path for when 1.0 is released (likely Q2 2026).

## Missing Critical Features

**No Offline Support:**
- Problem: Timer doesn't work offline. If network disconnects, user loses current timer state (though server retains it). No sync-on-reconnect for time entries.
- Blocks: Users on unreliable connections; mobile usage in transit

**No Audit Trail for Invoices:**
- Problem: No record of who modified/deleted invoices, when, or why. Can't track invoice approval workflow.
- Blocks: Enterprise features; compliance use cases

**No Duplicate Invoice Detection:**
- Problem: User can create duplicate invoices for same client/date range. No warning if similar invoice exists.
- Blocks: Prevents accidental double-billing but has no safeguard

**No Webhook Retries:**
- Problem: If Stripe webhook processing fails, no automatic retry. Failed webhook silently logs error.
- Blocks: Some subscription updates won't be reflected in database until manual intervention

**No Export/Backup Feature:**
- Problem: Users cannot export data (invoices, time entries, clients). No backup mechanism.
- Blocks: User data is locked in; no disaster recovery option

---

*Concerns audit: 2026-02-11*
