---
phase: 01-logging-foundation
plan: 02
subsystem: infra
tags: [correlation-id, async-local-storage, request-logging, route-handler, middleware]

# Dependency graph
requires:
  - phase: 01-logging-foundation
    plan: 01
    provides: structured-logger-with-sanitization
provides:
  - AsyncLocalStorage-based correlation ID system
  - UUID v4 correlation ID generation per request
  - Middleware request logging with correlation tracking
  - Route handler wrapper (withLogging) for automatic observability
  - x-correlation-id response header on all requests
  - getCorrelationId() helper for service code
affects: [service-migration, all-route-handlers, error-tracking]

# Tech tracking
tech-stack:
  added: [node:async_hooks AsyncLocalStorage]
  patterns: [correlation-id-pattern, route-handler-wrapper, request-lifecycle-logging]

key-files:
  created:
    - src/lib/logging/correlation.ts
    - src/lib/logging/route-handler.ts
  modified:
    - src/middleware.ts
    - src/app/api/invoices/route.ts
    - src/app/api/clients/route.ts

key-decisions:
  - "Use AsyncLocalStorage for correlation ID propagation (with header fallback for edge cases)"
  - "Generate correlation ID in middleware and allow client-provided IDs via x-correlation-id header"
  - "Route handler wrapper re-throws errors to preserve existing handleError pattern"
  - "Log both request (middleware) and response (route handler) for complete request lifecycle"

patterns-established:
  - "Correlation ID flow: middleware generates -> AsyncLocalStorage stores -> route handler reads -> response header returns"
  - "Route handler wrapping pattern: export const GET = withLogging(handleGet) for zero-touch observability"
  - "Error handling: wrapper logs then re-throws, existing try/catch+handleError still works"

# Metrics
duration: 2min 55s
completed: 2026-02-11
---

# Phase 01 Plan 02: Request Correlation and Logging Integration Summary

**AsyncLocalStorage-based correlation IDs (UUID v4) generated per request in middleware, automatic route handler logging wrapper tracking method/path/status/timing, demonstrated on invoices and clients API routes**

## Performance

- **Duration:** 2m 55s
- **Started:** 2026-02-11T12:37:47Z
- **Completed:** 2026-02-11T12:40:42Z
- **Tasks:** 2
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- Created AsyncLocalStorage-based correlation ID system with requestContext store
- Implemented generateCorrelationId() using crypto.randomUUID() for UUID v4 generation
- Updated middleware to generate correlation IDs, wrap execution in AsyncLocalStorage context, and log incoming requests
- Added x-correlation-id response header to all requests through middleware
- Created withLogging route handler wrapper for automatic request/response logging
- Wrapped invoices API routes (GET, POST) with withLogging for observability
- Wrapped clients API routes (GET, POST) with withLogging for observability
- Route handler logs include: method, path, statusCode, duration, correlationId
- Error logs include full sanitized error context with stack traces

## Task Commits

Each task was committed atomically:

1. **Task 1: Create correlation ID system and integrate into middleware** - `6ef99e2` (feat)
2. **Task 2: Create route handler wrapper and demonstrate on example routes** - `7362ff7` (feat)

## Files Created/Modified

**Created:**
- `src/lib/logging/correlation.ts` - AsyncLocalStorage-based correlation ID store with getCorrelationId() and generateCorrelationId()
- `src/lib/logging/route-handler.ts` - withLogging wrapper for automatic route handler logging with timing and error handling

**Modified:**
- `src/middleware.ts` - Generate correlation IDs, wrap in AsyncLocalStorage context, set response header, log requests
- `src/app/api/invoices/route.ts` - Refactored to use withLogging wrapper (handleGet/handlePost exported as wrapped GET/POST)
- `src/app/api/clients/route.ts` - Refactored to use withLogging wrapper (handleGet/handlePost exported as wrapped GET/POST)

## Decisions Made

1. **AsyncLocalStorage with header fallback** - Use AsyncLocalStorage as primary correlation ID propagation mechanism, with x-correlation-id request header as fallback for route handlers (where AsyncLocalStorage context may not propagate in Next.js Edge Runtime)

2. **Client-provided correlation IDs** - Allow clients to provide correlation IDs via x-correlation-id request header for distributed tracing scenarios (middleware prefers client ID over generating new one)

3. **Error re-throwing in wrapper** - Route handler wrapper logs errors then re-throws to preserve existing error handling pattern (try/catch + handleError). This makes the wrapper purely additive.

4. **Dual logging points** - Log at both middleware (request in) and route handler (response out) to capture complete request lifecycle with timing

## Deviations from Plan

**None - plan executed exactly as written.**

The plan noted that AsyncLocalStorage context might not propagate from middleware to route handlers in Next.js. The implementation correctly handles this by having the withLogging wrapper use a fallback strategy: `getCorrelationId() || request.headers.get('x-correlation-id') || generateCorrelationId()`. This ensures correlation IDs work regardless of AsyncLocalStorage propagation behavior.

## Issues Encountered

**No issues encountered.** TypeScript compilation and build succeeded on first attempt. All verification criteria passed.

## Request Lifecycle Flow

**Complete tracing from middleware through route handler:**

1. **Middleware entry:** Request arrives, correlation ID generated/extracted
2. **AsyncLocalStorage:** Context set with `requestContext.run({ correlationId }, ...)`
3. **Request log:** Middleware logs "Request received" with method, path, userAgent, correlationId
4. **Response header:** x-correlation-id set on response before returning
5. **Route handler entry:** withLogging wrapper starts timing
6. **Correlation ID access:** Wrapper reads from AsyncLocalStorage → header → generates new (fallback chain)
7. **Handler execution:** Actual route logic runs (existing try/catch + handleError intact)
8. **Response log:** withLogging logs "API response" with statusCode, duration, correlationId
9. **Error log (if error):** withLogging logs "API error" with sanitized error context, then re-throws

**Service code integration:** Any service function can call `getCorrelationId()` to access the correlation ID for logging/tracing purposes (Phase 2 scope).

## Verification Results

All verification criteria from plan passed:

- ✅ TypeScript compilation passes with zero errors
- ✅ npm run build succeeds
- ✅ Middleware generates UUID correlation IDs (crypto.randomUUID via generateCorrelationId)
- ✅ Middleware sets x-correlation-id response header
- ✅ Route handler wrapper logs method, path, statusCode, duration
- ✅ Invoices route exports use withLogging wrapper (GET, POST)
- ✅ Clients route exports use withLogging wrapper (GET, POST)
- ✅ Error logging includes sanitizeError call
- ✅ AsyncLocalStorage store exists in correlation.ts
- ✅ getCorrelationId() exported for service code use

## Next Phase Readiness

**Ready for Phase 2 (Service Migration to Structured Logging)**

The logging infrastructure is complete and provides:
- ✅ Correlation IDs on every request
- ✅ Middleware request logging
- ✅ Route handler automatic logging
- ✅ Error context with stack traces
- ✅ getCorrelationId() available for service code
- ✅ PII sanitization on all logs (from Plan 01)
- ✅ Environment-gated Axiom transport (from Plan 01)

**Blockers:** None

**Notes:**
- All console.error/console.log calls in services can now be replaced with structured logger calls (with correlation IDs automatically available)
- AsyncLocalStorage propagation from middleware to route handlers may not work in all Next.js runtime configurations - the header fallback ensures correlation IDs still work
- The withLogging pattern can be applied to all remaining API routes in Phase 2

## Self-Check: PASSED

All claimed files and commits verified:

```bash
# Files exist
✅ src/lib/logging/correlation.ts
✅ src/lib/logging/route-handler.ts
✅ src/middleware.ts (modified)
✅ src/app/api/invoices/route.ts (modified)
✅ src/app/api/clients/route.ts (modified)

# Commits exist
✅ 6ef99e2 (Task 1 - correlation ID system)
✅ 7362ff7 (Task 2 - route handler wrapper)

# Key exports present
✅ requestContext exported from correlation.ts
✅ getCorrelationId exported from correlation.ts
✅ generateCorrelationId exported from correlation.ts
✅ withLogging exported from route-handler.ts
✅ x-correlation-id header set in middleware
✅ withLogging used in invoices and clients routes
```

---
*Phase: 01-logging-foundation*
*Completed: 2026-02-11T12:40:42Z*
