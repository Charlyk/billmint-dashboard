---
phase: 01-logging-foundation
plan: 01
subsystem: infra
tags: [axiom, logging, pii-sanitization, structured-logs, vercel]

# Dependency graph
requires:
  - phase: none
    provides: greenfield
provides:
  - Axiom client singleton with VERCEL_ENV environment gating
  - Structured logging types (LogLevel, ServiceName, StructuredLog, ErrorContext)
  - PII sanitization for nested objects, arrays, and error stack traces
  - Environment-conditional logger (Axiom in production, console in dev)
  - Service logger factory for all 14 application services
  - withAxiom route handler wrapper for Plan 02
affects: [01-02, service-migration, route-handlers, analytics]

# Tech tracking
tech-stack:
  added: [@axiomhq/js@1.4.0, @axiomhq/logging@0.2.0, @axiomhq/nextjs@0.2.0]
  patterns: [structured-logging, pii-sanitization, environment-gating, service-logger-pattern]

key-files:
  created:
    - src/types/logging.ts
    - src/lib/logging/axiom.ts
    - src/lib/logging/sanitizers.ts
    - src/lib/logging/logger.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Use VERCEL_ENV (not NODE_ENV) for production detection to match Vercel's environment model"
  - "Apply PII sanitization formatter only in production to avoid dev performance cost"
  - "Export withAxiom from logger.ts to centralize logging API surface"
  - "Use ternary expression for transports to satisfy non-empty array type requirement"

patterns-established:
  - "Service logger pattern: createServiceLogger('service-name') returns logger with automatic service context"
  - "PII redaction: 12 field types + email/card/token regex patterns + max depth 5 for circular refs"
  - "Environment gating: production = VERCEL_ENV === 'production' with Axiom client null check"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 01 Plan 01: Logging Foundation Summary

**Structured JSON logging with Axiom integration, environment-conditional transports (Axiom in production, console in dev), and PII sanitization covering 12 field types plus email/card/token pattern masking**

## Performance

- **Duration:** 3m 7s
- **Started:** 2026-02-11T12:32:01Z
- **Completed:** 2026-02-11T12:35:08Z
- **Tasks:** 2
- **Files modified:** 6 (3 created, 3 modified)

## Accomplishments

- Installed Axiom packages (@axiomhq/js, @axiomhq/logging, @axiomhq/nextjs) for structured log ingestion
- Defined comprehensive structured log types covering all 14 service names and log schema
- Created Axiom client singleton with VERCEL_ENV gating (null in dev, initialized in production with token)
- Implemented PII sanitization handling nested objects, arrays, and error stack traces with 12 redacted field types
- Built environment-conditional logger with AxiomJSTransport in production, ConsoleTransport in dev
- Exported service logger factory (createServiceLogger) and route handler wrapper (withAxiom) for Plan 02

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Axiom packages and define structured log types** - `cd93e3c` (feat)
2. **Task 2: Create Axiom client singleton, PII sanitizer, and environment-gated logger** - `d0b69ff` (feat)

## Files Created/Modified

**Created:**
- `src/types/logging.ts` - Structured log schema types: LogLevel, ServiceName (14 services), StructuredLog, ErrorContext, LoggerOptions
- `src/lib/logging/axiom.ts` - Axiom client singleton with VERCEL_ENV gating and dataset configuration
- `src/lib/logging/sanitizers.ts` - PII sanitization functions with 12 field types and email/card/token regex patterns
- `src/lib/logging/logger.ts` - Main logger with conditional transports, PII formatter, service logger factory, withAxiom wrapper

**Modified:**
- `package.json` - Added @axiomhq/js, @axiomhq/logging, @axiomhq/nextjs dependencies
- `package-lock.json` - Lockfile updated with Axiom package dependency tree

## Decisions Made

1. **VERCEL_ENV over NODE_ENV** - Use `process.env.VERCEL_ENV === 'production'` for environment detection instead of NODE_ENV to match Vercel's deployment model (preview/production separation)

2. **Production-only PII sanitization formatter** - Apply PII sanitization formatter only in production to avoid performance cost during local development where logs are human-readable console output

3. **Centralized logging API** - Export withAxiom from logger.ts (not importing from @axiomhq/nextjs in routes) to maintain single API entry point for all logging functionality

4. **Non-empty transport array type** - Use ternary expression for transport selection instead of conditional push to satisfy Logger's `[Transport, ...Transport[]]` type requirement

## Deviations from Plan

**None - plan executed exactly as written.**

TypeScript compilation error (Transport[] not assignable to [Transport, ...Transport[]]) was encountered during implementation but resolved by refactoring conditional transport building from push pattern to ternary expression. This was a technical correction during Task 2, not a plan deviation.

## Issues Encountered

**TypeScript type error on Logger instantiation**
- **Issue:** Logger's transports config requires non-empty tuple type `[Transport, ...Transport[]]`, but conditional push pattern produced `Transport[]` type
- **Resolution:** Refactored to ternary expression: `const transports = isProduction && axiomClient ? [new AxiomJSTransport(...)] : [new ConsoleTransport()]`
- **Impact:** No functional change, type system now correctly enforces at least one transport present

## User Setup Required

**External services require manual configuration.** See Plan 01 frontmatter for:
- `AXIOM_TOKEN` - Obtain from Axiom Dashboard → Settings → API Tokens → New Token (with ingest permission)
- `AXIOM_DATASET` - Create dataset in Axiom Dashboard → Datasets → New Dataset (e.g., 'billmint-logs')

These environment variables are required for production logging. Development mode works without them (uses console transport).

## Next Phase Readiness

**Ready for Plan 02 (Correlation IDs and Route Handler Integration)**

The logging foundation is complete and provides:
- ✅ Structured logger with environment gating
- ✅ PII sanitization for production logs
- ✅ Service logger factory for all 14 services
- ✅ withAxiom wrapper ready for route handlers
- ✅ TypeScript types for log schema

**Blockers:** None

**Notes:**
- AXIOM_TOKEN and AXIOM_DATASET environment variables must be configured before production deployment
- All console.error calls across services can now be replaced with structured logger calls (Plan 02 scope)

## Self-Check: PASSED

All claimed files and commits verified:
- ✅ src/types/logging.ts
- ✅ src/lib/logging/axiom.ts
- ✅ src/lib/logging/sanitizers.ts
- ✅ src/lib/logging/logger.ts
- ✅ Commit cd93e3c (Task 1)
- ✅ Commit d0b69ff (Task 2)

---
*Phase: 01-logging-foundation*
*Completed: 2026-02-11*
