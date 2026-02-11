# BillMint — Observability & Analytics

## What This Is

BillMint is an existing time-tracking and invoicing SaaS built with Next.js, Supabase, and Stripe. The observability milestones (v1.0 + v1.1) added production-grade observability: Axiom structured backend logging with PII sanitization and correlation IDs on 100% of API routes, PostHog anonymous product analytics with 21 lifecycle events (client + server-side), and posthog-node for server-side billing event tracking from Stripe webhooks.

## Core Value

When something breaks in production, find the root cause fast through structured logs — and understand how users actually use the product through analytics.

## Requirements

### Validated

- ✓ Time tracking with timer (start/pause/resume/stop/discard) — existing
- ✓ Client and project management (CRUD) — existing
- ✓ Invoice creation, sending, PDF generation — existing
- ✓ Stripe billing integration (subscriptions, webhooks) — existing
- ✓ Email service (verification, password reset, invoice delivery) — existing
- ✓ Authentication (email/password, Google OAuth) — existing
- ✓ User settings and preferences — existing
- ✓ Public invoice viewing and PDF download — existing
- ✓ Cron-based timer auto-pause — existing
- ✓ Reports (weekly/monthly summaries) — existing
- ✓ Axiom structured logging for all backend services — v1.0
- ✓ Replace all console.error/console.log with Axiom logger (75 calls) — v1.0
- ✓ PostHog page view tracking (anonymous, production-only) — v1.0
- ✓ PostHog event tracking for key user actions (21 lifecycle events) — v1.0
- ✓ Production-only activation (no dev noise) — v1.0
- ✓ Server-side PostHog for Stripe webhook billing events (posthog-node) — v1.1
- ✓ 100% API route logging coverage with withLogging wrapper (48 routes) — v1.1
- ✓ Correlation ID propagation across all API handlers — v1.1
- ✓ Unused first_* funnel helpers removed, PostHog filter approach documented — v1.1

### Active

(None — planning next milestone)

### Out of Scope

- Session recording — adds complexity and privacy concerns
- Feature flags via PostHog — not needed for observability
- PostHog user identification — anonymous tracking only
- Real-time alerting rules — set up in Axiom dashboard manually
- Custom PostHog dashboards — manual setup after events are flowing

## Context

**Current state (v1.1 shipped):**
- 134 files changed across 6 phases (v1.0 + v1.1)
- Tech stack: Next.js 16, React 19, Supabase, Stripe, Axiom, PostHog, posthog-node
- Logging: Structured JSON via Axiom with PII sanitization, correlation IDs, withLogging on 100% of API routes
- Analytics: Anonymous PostHog with 21 typed lifecycle events (client-side) + 3 billing events (server-side)
- 13 service files fully instrumented with structured logging
- 48 API routes instrumented with withLogging wrapper
- 0 console.error/console.log calls remain in services
- 0 known observability tech debt

## Constraints

- **Stack**: Axiom for backend logging, PostHog for product analytics (client + server)
- **Privacy**: PostHog anonymous-only (person_profiles: 'identified_only')
- **Environment**: VERCEL_ENV === 'production' gates both logging and analytics
- **Existing code**: All console calls replaced — single structured logging system

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Axiom for backend, PostHog for frontend | Clear separation: server logs vs product analytics | ✓ Good — clean architecture, no overlap |
| Replace all console.error with Axiom | Eliminate scattered logging, single source of truth | ✓ Good — 75 calls replaced, 0 remaining |
| Anonymous PostHog only | Privacy-first, no PII sent to third party | ✓ Good — zero identify calls, IDs only in events |
| Production only (VERCEL_ENV) | Avoid polluting analytics/logs with dev data | ✓ Good — consistent gating across both systems |
| Track all key user actions | Timer, invoice, billing, CRUD — full product visibility | ✓ Good — 21 events covering core workflows |
| AsyncLocalStorage for correlation IDs | Request context propagation without explicit passing | ✓ Good — clean service code, automatic correlation |
| PostHog "First time event" filter for funnels | Avoid unreliable client-side first-time detection | ✓ Good — simpler, PostHog handles natively |
| posthog-node for webhook billing events | Server-side tracking needed where no browser exists | ✓ Good — 3 billing lifecycle events tracked reliably |
| flushAt:1 / flushInterval:0 for webhooks | Low-volume billing events must not be lost | ✓ Good — immediate flush, data reliability |
| customerId as distinctId for subscription events | Stripe webhooks don't include userId | — Acceptable — cross-referencing requires customer ID lookup |
| withLogging on 100% of API routes | Consistent request/response logging and correlation | ✓ Good — full visibility across all endpoints |

---
*Last updated: 2026-02-11 after v1.1 milestone*
