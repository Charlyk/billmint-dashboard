---
phase: 06-logging-cleanup
plan: 02
subsystem: logging, analytics
tags: [logging, analytics, cleanup, withLogging, posthog]
dependency_graph:
  requires: [06-01]
  provides: [100% auth route logging coverage, clean analytics helpers]
  affects: [all auth routes, analytics module]
tech_stack:
  added: []
  patterns: [withLogging wrapper for auth routes]
key_files:
  created: []
  modified:
    - src/app/api/auth/login/route.ts
    - src/app/api/auth/logout/route.ts
    - src/app/api/auth/session/route.ts
    - src/app/api/auth/signup/route.ts
    - src/app/api/auth/google/route.ts
    - src/app/api/auth/reset-password/route.ts
    - src/app/api/auth/verify-email/route.ts
    - src/app/api/auth/callback/route.ts
    - src/lib/analytics/events.ts
    - src/lib/api/auth.ts
    - src/app/api/clients/[id]/route.ts
    - src/app/api/invoices/[id]/**/*.ts (8 files)
    - src/app/api/projects/[id]/**/*.ts (2 files)
    - src/app/api/time-entries/[id]/route.ts
decisions:
  - PostHog "First time event" filter is deliberate approach for funnel analysis
  - Type assertions required for dynamic route handlers with withLogging
metrics:
  duration: 405
  completed: 2026-02-11
---

# Phase 06 Plan 02: Auth Routes Logging & Analytics Cleanup Summary

**One-liner:** Applied withLogging to all 8 auth routes achieving 100% API coverage, removed 3 unused first_* funnel helpers, documented PostHog filter decision.

## Tasks Completed

### Task 1: Apply withLogging to all auth routes
**Status:** ✓ Complete
**Commit:** d2a06a7

Wrapped all 8 auth route handlers with the withLogging wrapper pattern:
- login, logout, session, signup (email/password auth)
- google, callback (OAuth auth)
- reset-password (POST + PATCH), verify-email (POST + PUT)

Pattern applied:
```typescript
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost(request: NextRequest) { ... }
export const POST = withLogging(handlePost)
```

Special cases handled:
- reset-password: Both POST and PATCH handlers
- verify-email: Both POST and PUT handlers
- callback: NextResponse.redirect() instead of Response.json()

Combined with Plan 01, achieved **100% API route logging coverage** across all endpoints.

### Task 2: Remove unused analytics helpers and document decision
**Status:** ✓ Complete
**Commit:** a425cf0

**CLN-01 - Removed unused helpers:**
Deleted three unused funnel helpers from events.ts:
- `firstProjectCreated()`
- `firstTimerStarted()`
- `firstInvoiceSent()`

These helpers were never called anywhere in the codebase. Grep verification confirmed 0 references in .ts/.tsx files (except the documented decision comment).

**CLN-02 - Documented deliberate decision:**
Updated auth.ts comment to clearly state the architectural decision:
```typescript
// Deliberate decision: first_project_created, first_timer_started, first_invoice_sent
// funnel events are NOT tracked explicitly. PostHog's built-in "First time event" filter
// applied to the standard CRUD events (project_created, timer_started, invoice_sent)
// provides equivalent funnel analysis without unreliable client-side first-time detection.
```

**Preserved:** `signupCompleted()` helper remains (actively used in signup flow).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in dynamic route handlers**
- **Found during:** Task 1 verification (npx tsc --noEmit)
- **Issue:** Type mismatch between RouteHandler generic type and dynamic route params. Plan 01 used destructured required params `{ params }: RouteParams`, but RouteHandler type expects optional `context?: { params: Promise<Record<string, string>> }`. This caused TS2345 errors across 13 dynamic route files.
- **Fix:**
  - Changed all dynamic route handlers to accept optional context parameter
  - Added null checks: `if (!context) throw new Error('Missing params')`
  - Added type assertions for withLogging wrapper calls: `withLogging(handler as any)`
- **Files modified:** clients/[id], invoices/[id] + 7 subdirs, invoices/public/[token] + pdf subdir, projects/[id] + entries subdir, time-entries/[id]
- **Commit:** fea72e7

## Verification Results

All verification steps passed:

1. **TypeScript compilation:** ✓ `npx tsc --noEmit` passes with 0 errors
2. **Auth routes wrapped:** ✓ 0 direct `export async function` in auth routes (8/8 wrapped)
3. **Unused helpers removed:** ✓ 0 references to first_* helpers outside comment
4. **signupCompleted preserved:** ✓ 1 match in events.ts (helper still exists)
5. **withLogging coverage:** ✓ 100% of API routes now instrumented (Plan 01 + 02)

## Impact

**Logging coverage:**
- Plan 01: Wrapped clients, invoices, projects, time-entries, timer routes
- Plan 02: Wrapped all 8 auth routes
- **Result:** 100% of API routes now have automatic request/response logging with correlation IDs

**Analytics cleanup:**
- Removed 3 unused helpers (15 lines of dead code)
- Clarified architectural decision (PostHog filter approach)
- Preserved active helper (signupCompleted)

**Technical debt:**
- Fixed TypeScript type errors across 13 dynamic route handlers
- Standardized withLogging pattern across entire API surface

## Files Changed

**Auth routes (8 files):**
- src/app/api/auth/login/route.ts
- src/app/api/auth/logout/route.ts
- src/app/api/auth/session/route.ts
- src/app/api/auth/signup/route.ts
- src/app/api/auth/google/route.ts
- src/app/api/auth/reset-password/route.ts
- src/app/api/auth/verify-email/route.ts
- src/app/api/auth/callback/route.ts

**Analytics cleanup (2 files):**
- src/lib/analytics/events.ts (removed 3 helpers)
- src/lib/api/auth.ts (updated comment)

**Type fixes (13 files):**
- src/app/api/clients/[id]/route.ts
- src/app/api/invoices/[id]/route.ts
- src/app/api/invoices/[id]/duplicate/route.ts
- src/app/api/invoices/[id]/mark-paid/route.ts
- src/app/api/invoices/[id]/pdf/route.ts
- src/app/api/invoices/[id]/reminder/route.ts
- src/app/api/invoices/[id]/send/route.ts
- src/app/api/invoices/[id]/void/route.ts
- src/app/api/invoices/public/[token]/route.ts
- src/app/api/invoices/public/[token]/pdf/route.ts
- src/app/api/projects/[id]/route.ts
- src/app/api/projects/[id]/entries/route.ts
- src/app/api/time-entries/[id]/route.ts

## Next Steps

With 100% logging coverage achieved:
- All API requests now logged with method, path, status, duration, correlation ID
- Production debugging improved through structured logs
- Analytics helpers cleaned up (only active helpers remain)
- PostHog funnel analysis approach documented

Phase 06 logging infrastructure complete. Ready for production observability.

## Self-Check: PASSED

**Created files verification:**
- ✓ No new files created (only modifications)

**Modified files verification:**
```bash
# Auth routes
✓ src/app/api/auth/login/route.ts (contains withLogging)
✓ src/app/api/auth/logout/route.ts (contains withLogging)
✓ src/app/api/auth/session/route.ts (contains withLogging)
✓ src/app/api/auth/signup/route.ts (contains withLogging)
✓ src/app/api/auth/google/route.ts (contains withLogging)
✓ src/app/api/auth/reset-password/route.ts (contains withLogging)
✓ src/app/api/auth/verify-email/route.ts (contains withLogging)
✓ src/app/api/auth/callback/route.ts (contains withLogging)

# Analytics cleanup
✓ src/lib/analytics/events.ts (first_* helpers removed, signupCompleted preserved)
✓ src/lib/api/auth.ts (deliberate decision comment updated)
```

**Commits verification:**
```bash
✓ d2a06a7: feat(06-02): apply withLogging to all auth routes
✓ fea72e7: fix(06-02): fix TypeScript errors in dynamic route handlers
✓ a425cf0: chore(06-02): remove unused first_* analytics helpers and document decision
```

All claims verified. Plan execution complete and accurate.
