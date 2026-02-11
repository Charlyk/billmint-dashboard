---
phase: 03-analytics-foundation
plan: 01
subsystem: analytics
tags: [posthog, product-analytics, pageview-tracking, privacy, anonymous-tracking]
dependency_graph:
  requires: []
  provides:
    - posthog-page-view-tracking
    - anonymous-analytics-foundation
  affects:
    - root-layout
tech_stack:
  added:
    - posthog-js: "Product analytics SDK for page view tracking"
  patterns:
    - Environment-gated initialization (production-only PostHog)
    - Anonymous-only tracking (no user profiles, no PII)
    - Manual page view capture for App Router compatibility
    - Suspense boundary for useSearchParams hydration safety
key_files:
  created:
    - src/lib/analytics/posthog.ts
    - src/contexts/posthog-provider.tsx
    - src/components/analytics/posthog-pageview.tsx
  modified:
    - src/app/layout.tsx
    - package.json
key_decisions:
  - decision: "Use person_profiles: 'identified_only' for anonymous-only tracking"
    rationale: "Prevents PostHog from creating user profiles for anonymous visitors, ensuring zero PII exposure"
    alternatives: ["person_profiles: 'always' (creates profiles for all users, rejected for privacy)"]
  - decision: "Position PHProvider outside Providers in root layout"
    rationale: "PostHog doesn't depend on auth/SWR context, should track all pages including unauthenticated (landing, login, signup)"
    alternatives: ["Inside Providers (rejected - would miss landing page traffic)"]
  - decision: "Wrap PostHogPageView in Suspense boundary"
    rationale: "useSearchParams requires Suspense to prevent hydration errors in Next.js App Router"
    alternatives: ["No Suspense (rejected - causes hydration mismatch errors)"]
  - decision: "Set capture_pageview: false and implement manual tracking"
    rationale: "PostHog auto-capture doesn't work correctly with App Router client-side navigation"
    alternatives: ["Auto-capture (rejected - misses route changes)"]
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_created: 3
  files_modified: 2
  commits: 2
  completed_date: "2026-02-11"
---

# Phase 03 Plan 01: PostHog Anonymous Page View Tracking Summary

**One-liner:** PostHog analytics integrated with anonymous-only page view tracking in production, using environment-gated initialization and Suspense-wrapped route change capture.

## What Was Built

Integrated PostHog product analytics into BillMint with privacy-first anonymous tracking:

1. **PostHog Config Module** (`src/lib/analytics/posthog.ts`)
   - Environment-gated production detection using `VERCEL_ENV === 'production'`
   - Exports POSTHOG_KEY and POSTHOG_HOST with fallback to US cloud instance
   - Mirrors existing Axiom config pattern for consistency

2. **PostHog Provider** (`src/contexts/posthog-provider.tsx`)
   - Client-side PostHog initialization with anonymous-only config
   - `person_profiles: 'identified_only'` prevents user profile creation
   - `capture_pageview: false` for manual tracking (App Router requirement)
   - `disable_session_recording: true` for privacy
   - `disable_external_dependency_loading: true` prevents hydration issues
   - Passthrough mode when not in production or missing API key

3. **Page View Tracker** (`src/components/analytics/posthog-pageview.tsx`)
   - Client component using usePathname and useSearchParams hooks
   - Captures `$pageview` event on every route change
   - Includes full URL with pathname and search params
   - Returns null (invisible component)

4. **Root Layout Integration** (`src/app/layout.tsx`)
   - PHProvider wraps entire app (outside Providers for full page coverage)
   - PostHogPageView wrapped in Suspense to prevent hydration errors
   - Preserves existing theme script, fonts, metadata, and Providers

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All success criteria met:

- ✓ posthog-js is installed (v1.345.4)
- ✓ App builds without errors (`npm run build` passes)
- ✓ PostHog initializes ONLY when VERCEL_ENV === 'production' AND NEXT_PUBLIC_POSTHOG_KEY is set
- ✓ Page views captured on every route change via PostHogPageView component
- ✓ person_profiles set to 'identified_only' (no user profiles for anonymous visitors)
- ✓ Session recording disabled (`disable_session_recording: true`)
- ✓ No posthog.identify() calls exist anywhere in codebase (verified with grep)
- ✓ PostHogPageView wrapped in Suspense to prevent hydration errors

## Key Implementation Details

**Privacy Guarantees:**
- No user profiles created (person_profiles: 'identified_only')
- No session recordings (disable_session_recording: true)
- No posthog.identify() calls (anonymous-only)
- Zero PII sent to PostHog

**Production Gating:**
- PostHog only initializes when VERCEL_ENV === 'production' AND POSTHOG_KEY exists
- Development mode: PHProvider returns passthrough (no PostHog context)
- No analytics events or network requests in development

**App Router Compatibility:**
- Manual page view capture (capture_pageview: false)
- useSearchParams wrapped in Suspense boundary
- Client components properly marked with 'use client'
- Full Next.js build validates hydration safety

## Dependencies for Next Plans

**Provides:**
- PostHog client initialized and ready for custom event tracking
- Page view tracking foundation for user journey analysis
- Anonymous tracking infrastructure for privacy-compliant analytics

**Enables:**
- Phase 03 Plan 02: Custom event tracking for user actions (timer, invoice, billing)
- Future: Funnel analysis for conversion optimization
- Future: Feature usage tracking for product decisions

## Self-Check: PASSED

**Created files verified:**
- FOUND: src/lib/analytics/posthog.ts
- FOUND: src/contexts/posthog-provider.tsx
- FOUND: src/components/analytics/posthog-pageview.tsx

**Modified files verified:**
- FOUND: src/app/layout.tsx (PHProvider and PostHogPageView integration confirmed)
- FOUND: package.json (posthog-js dependency added)

**Commits verified:**
- FOUND: 1bcad5c (Task 1: PostHog config, provider, pageview components)
- FOUND: db39e27 (Task 2: Root layout integration)

All artifacts created successfully and commits exist in git history.
