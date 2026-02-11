# BillMint — Observability & Analytics

## What This Is

BillMint is an existing time-tracking and invoicing SaaS built with Next.js, Supabase, and Stripe. This milestone adds production observability via Axiom (structured backend logging) and PostHog (product analytics), replacing scattered console.error calls with structured, queryable logs and tracking key user actions across the app.

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

### Active

- [ ] Axiom structured logging for all backend services
- [ ] Replace all console.error/console.log with Axiom logger
- [ ] PostHog page view tracking
- [ ] PostHog event tracking for key user actions
- [ ] Production-only activation (no dev noise)

### Out of Scope

- Session recording — adds complexity and privacy concerns, defer to later
- Feature flags via PostHog — not needed for this milestone
- PostHog user identification — anonymous tracking only for now
- Real-time alerting rules — set up in Axiom dashboard manually after integration
- Custom PostHog dashboards — manual setup after events are flowing

## Context

- 35+ scattered `console.error()` calls across 14 service files — no centralized logging
- No analytics currently — zero visibility into feature usage
- Service layer is well-structured (`src/lib/services/*.ts`) — clean injection points for logging
- API route layer (`src/app/api/`) handles all HTTP — good place for request/response logging
- App uses React Context for client-side state — PostHog provider fits naturally
- Next.js App Router with middleware — can intercept requests for logging

## Constraints

- **Stack**: Must use Axiom and PostHog specifically (user's choice)
- **Privacy**: PostHog must be anonymous-only (no user identification)
- **Environment**: Logging and analytics active in production only
- **Existing code**: Replace all console.error calls — don't leave parallel systems

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Axiom for backend, PostHog for frontend | Clear separation: server logs vs product analytics | — Pending |
| Replace all console.error with Axiom | Eliminate scattered logging, single source of truth | — Pending |
| Anonymous PostHog only | Privacy-first, no PII sent to third party | — Pending |
| Production only | Avoid polluting analytics/logs with dev data | — Pending |
| Track all key user actions | Timer, invoice, billing, CRUD — full product visibility | — Pending |

---
*Last updated: 2026-02-11 after initialization*
