# Roadmap: BillMint Observability & Analytics

## Overview

This roadmap transforms BillMint from console-based debugging into production-grade observability by establishing structured logging infrastructure (Axiom), systematically migrating 35+ scattered console.error calls across service files, and layering product analytics (PostHog) to track user journeys through timer-to-invoice-to-payment workflows. The 4-phase approach follows foundation-first construction: environment gating and PII sanitization before any production logs, service instrumentation with async webhook patterns to prevent timeouts, then comprehensive lifecycle event tracking for product visibility.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Logging Foundation** - Production-only structured logging infrastructure with trace correlation
- [ ] **Phase 2: Service Migration** - Replace console calls with Axiom logger across all backend services
- [ ] **Phase 3: Analytics Foundation** - PostHog integration with anonymous page view and event tracking
- [ ] **Phase 4: Lifecycle Events** - Comprehensive product analytics for timer, invoice, and billing workflows

## Phase Details

### Phase 1: Logging Foundation
**Goal**: Production-ready logging infrastructure with structured JSON, environment gating, PII sanitization, and request correlation
**Depends on**: Nothing (first phase)
**Requirements**: LOG-01, LOG-02, LOG-03, LOG-04, LOG-05
**Success Criteria** (what must be TRUE):
  1. All logs use structured JSON format with consistent schema (level, message, service, timestamp, context)
  2. Logging activates in production only — development falls back to console without Axiom calls
  3. Every API request generates a unique correlation ID propagated through all downstream logs
  4. All API routes automatically log request method, path, status code, and response time
  5. Error logs include full stack traces with sanitized context (no PII, payment data, or session tokens)
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Core logging infrastructure (types, Axiom client, logger, PII sanitizers, env gating)
- [x] 01-02-PLAN.md — Correlation IDs, middleware logging, route handler wrapper, example routes

### Phase 2: Service Migration
**Goal**: All backend services use Axiom logger with service-scoped context, replacing scattered console calls
**Depends on**: Phase 1 (requires logger utility, trace IDs, sanitization helpers)
**Requirements**: MIG-01, MIG-02, MIG-03, WH-01, WH-02, CRON-01
**Success Criteria** (what must be TRUE):
  1. All console.error calls in service files (14 files, 35+ instances) are replaced with structured Axiom logger
  2. All console.log calls in service files are replaced with appropriate log levels (info/warn/error)
  3. Services use scoped loggers (e.g., logger.forService('billing')) with automatic service context
  4. Stripe webhook events log complete lifecycle: received, validated, processed, response sent
  5. Webhook logging is async (fire-and-forget) with response times under 3 seconds to prevent Stripe timeouts
  6. Cron jobs (timer auto-pause, email summaries) log execution start, duration, success/failure, items processed
**Plans**: TBD

Plans:
- [ ] 02-01: TBD (will be created during plan-phase)

### Phase 3: Analytics Foundation
**Goal**: PostHog anonymous analytics with automatic page view tracking active in production
**Depends on**: Phase 1 (environment gating patterns established)
**Requirements**: ANA-01, ANA-02, ANA-03, ANA-04
**Success Criteria** (what must be TRUE):
  1. PostHog provider integrated in app layout with anonymous-only tracking configuration
  2. Page views are tracked automatically on all route changes (App Router navigation)
  3. PostHog activates in production only — completely disabled in development environment
  4. Zero PII (email, name, user ID) is sent to PostHog in any event or property
**Plans**: TBD

Plans:
- [ ] 03-01: TBD (will be created during plan-phase)

### Phase 4: Lifecycle Events
**Goal**: Complete product visibility through comprehensive lifecycle event tracking for core user workflows
**Depends on**: Phase 3 (PostHog infrastructure operational)
**Requirements**: EVT-01, EVT-02, EVT-03, EVT-04, EVT-05
**Success Criteria** (what must be TRUE):
  1. Timer lifecycle events captured: start, pause, resume, stop, discard with duration metadata
  2. Invoice lifecycle events captured: create, send, view (public), mark paid, void with invoice amount
  3. Billing events captured: checkout started, subscription activated, plan changed, subscription cancelled
  4. CRUD events captured: client created/edited/deleted, project created/edited/archived, time entry created/edited/deleted
  5. Funnel-ready events captured: signup completed, first project created, first timer started, first invoice sent
**Plans**: TBD

Plans:
- [ ] 04-01: TBD (will be created during plan-phase)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Logging Foundation | 2/2 | ✓ Complete | 2026-02-11 |
| 2. Service Migration | 0/TBD | Not started | - |
| 3. Analytics Foundation | 0/TBD | Not started | - |
| 4. Lifecycle Events | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-11*
*Last updated: 2026-02-11 — Phase 1 complete*
