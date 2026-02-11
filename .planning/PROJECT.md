# BillMint — Observability & Analytics

## What This Is

BillMint is an existing time-tracking and invoicing SaaS built with Next.js, Supabase, and Stripe. The v1.0 milestone added production observability via Axiom (structured backend logging with PII sanitization and request correlation) and PostHog (anonymous product analytics with lifecycle event tracking), replacing 75 scattered console calls with structured, queryable logs and tracking 21 lifecycle events across timer, invoice, billing, and CRUD workflows.

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

### Active

(None — next milestone requirements TBD)

### Out of Scope

- Session recording — adds complexity and privacy concerns
- Feature flags via PostHog — not needed for observability
- PostHog user identification — anonymous tracking only
- Real-time alerting rules — set up in Axiom dashboard manually
- Custom PostHog dashboards — manual setup after events are flowing
- posthog-node for server-side tracking — deferred (webhook billing events)

## Context

**Current state (v1.0 shipped):**
- 67 files changed, 8,109 lines added across 4 phases
- Tech stack: Next.js 16, React 19, Supabase, Stripe, Axiom, PostHog
- Logging: Structured JSON via Axiom with PII sanitization and correlation IDs
- Analytics: Anonymous PostHog with 21 typed lifecycle events
- 13 service files fully instrumented with structured logging
- 0 console.error/console.log calls remain in services

**Known tech debt:**
- 3 billing webhook events need posthog-node for server-side tracking
- 3 funnel first-time events using PostHog filters instead of explicit tracking
- withLogging wrapper on 2 API routes (clients, invoices) — could extend to others

## Constraints

- **Stack**: Axiom for backend logging, PostHog for frontend analytics
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
| Client-side tracking (posthog-js) | Server-side posthog-node deferred for simplicity | ⚠️ Revisit — webhook events need server-side |
| PostHog "First time event" filter for funnels | Avoid unreliable client-side first-time detection | ✓ Good — simpler, PostHog handles natively |

---
*Last updated: 2026-02-11 after v1.0 milestone*
