# Phase 3: Analytics Foundation - Research

**Researched:** 2026-02-11
**Domain:** PostHog frontend analytics integration with Next.js 15 App Router
**Confidence:** MEDIUM-HIGH

## Summary

PostHog is the standard open-source product analytics platform for Next.js applications, with first-class support for the App Router pattern. The integration requires a client-side provider component, manual page view tracking (since Next.js doesn't fire navigation events), and environment-based initialization to prevent polluting production data with development activity.

For privacy-first anonymous tracking, PostHog supports `person_profiles: 'identified_only'` configuration which prevents creating user profiles for anonymous visitors, combined with session recording disabled and careful avoidance of PII in event properties. The platform integrates cleanly with Vercel's `VERCEL_ENV` variable for production-only activation.

Reverse proxy setup has two approaches: Next.js rewrites (simpler, configured in `next.config.js`) or middleware (more control, required if rewrites fail). The middleware approach can conflict with existing middleware matchers and forwards all cookies including sensitive auth tokens, requiring careful security consideration.

**Primary recommendation:** Use PostHog provider in app layout with anonymous-only tracking (`person_profiles: 'identified_only'`, session recording disabled), manual page view tracking with Suspense boundary, production-only initialization via `VERCEL_ENV === 'production'`, and defer reverse proxy implementation until ad-blocker issues are confirmed in production.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| posthog-js | 1.343.0+ (Feb 2026) | Frontend analytics SDK | Official PostHog client, built-in Next.js support, active maintenance |
| Next.js | 15.x | App Router framework | Already in use, required for integration patterns |
| React | 18.x | UI framework | Required by PostHog provider pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @axiomhq/js | Latest | Backend logging | Already integrated (Phase 1), complements PostHog frontend analytics |
| React Suspense | Built-in | Hydration error prevention | Required for PostHogPageView component with useSearchParams |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostHog | Google Analytics 4 | GA4: more ecosystem integration but privacy concerns, requires consent banners, less developer-friendly |
| PostHog | Plausible/Fathom | Better privacy by default but limited feature set (no event tracking, feature flags) |
| Manual page tracking | Auto-capture | Auto-capture doesn't work with App Router navigation, requires manual implementation |
| Middleware proxy | Rewrites in next.config.js | Rewrites simpler but may fail on some hosts (Netlify), middleware gives more control but security risks |

**Installation:**
```bash
npm install posthog-js
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   └── layout.tsx               # PostHog provider integration point
├── contexts/
│   ├── providers.tsx            # Existing providers, wrap with PostHog
│   └── posthog-provider.tsx     # 'use client' PostHog provider component
├── components/
│   └── analytics/
│       └── posthog-pageview.tsx # Page view tracking component
└── lib/
    └── analytics/
        ├── posthog.ts          # PostHog initialization config
        └── events.ts           # Type-safe event tracking helpers (optional)
```

### Pattern 1: Provider Setup with Environment Gating
**What:** Client-side provider that initializes PostHog only in production, wraps app in layout
**When to use:** Required for all PostHog integrations, prevents dev data pollution
**Example:**
```typescript
// src/lib/analytics/posthog.ts
export const isProduction = process.env.VERCEL_ENV === 'production';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// src/contexts/posthog-provider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { isProduction, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/analytics/posthog'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (isProduction && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        person_profiles: 'identified_only', // Anonymous tracking only
        capture_pageview: false,             // Manual tracking required
        capture_pageleave: true,
        disable_session_recording: true,     // Privacy: no session replays
        // Optional: prevent hydration issues
        disable_external_dependency_loading: true
      })
    }
  }, [])

  // Only provide PostHog context in production
  if (!isProduction || !POSTHOG_KEY) {
    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```
**Source:** [PostHog NextJS 15 guide](https://medium.com/@alexjamesdunlop/posthog-nextjs-15-how-to-add-web-analytics-49453b618c30), [Building Production Analytics with PostHog](https://hboon.com/building-production-analytics-with-posthog-a-complete-implementation-guide/)

### Pattern 2: Manual Page View Tracking with Suspense
**What:** Component that tracks route changes using Next.js navigation hooks, wrapped in Suspense to prevent hydration errors
**When to use:** Required because Next.js App Router doesn't fire navigation events automatically
**Example:**
```typescript
// src/components/analytics/posthog-pageview.tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url
      })
    }
  }, [pathname, searchParams, posthog])

  return null
}

// In app/layout.tsx, wrap in Suspense:
import { Suspense } from 'react'
import { PostHogPageView } from '@/components/analytics/posthog-pageview'

<PHProvider>
  <Suspense fallback={null}>
    <PostHogPageView />
  </Suspense>
  {children}
</PHProvider>
```
**Source:** [PostHog integration in Next.JS App Router](https://reetesh.in/blog/posthog-integration-in-next.js-app-router), [How to setup analytics w/ Posthog on Next.js](https://www.johnnyle.io/read/analytics)

### Pattern 3: Anonymous-Only Tracking (No PII)
**What:** Configuration and practices to ensure zero PII is sent to PostHog
**When to use:** Privacy-first analytics, GDPR compliance without consent banners
**Example:**
```typescript
// Configuration
posthog.init(POSTHOG_KEY, {
  person_profiles: 'identified_only',    // Don't create profiles for anonymous users
  disable_session_recording: true,       // No session replays (can capture PII)
})

// NEVER call posthog.identify() with user data
// ❌ WRONG: posthog.identify(user.id, { email: user.email, name: user.name })

// ✅ CORRECT: Don't identify at all for anonymous tracking
// If you must track authenticated users, use only anonymous IDs:
// posthog.identify(hashedUserId) // No email, name, or other PII

// Custom events: use IDs, not PII
posthog.capture('invoice_created', {
  invoice_id: 'inv_123',           // ✅ OK
  client_id: 'cli_456',            // ✅ OK
  amount: 1000,                    // ✅ OK
  // ❌ NEVER: client_email, client_name, user_email
})
```
**Source:** [GDPR compliant posthog tracking without consent](https://www.psimms.de/posts/gdpr-compliant-posthog-tracking-without-consent/), [PostHog in Practice: Data Pipelines](https://bix-tech.com/posthog-in-practice-how-to-build-data-pipelines-and-unlock-user-behavior-analytics/)

### Anti-Patterns to Avoid
- **Enabling `capture_pageview: true`:** Doesn't work with App Router navigation, creates duplicate/missing pageviews
- **Initializing PostHog without environment check:** Pollutes production analytics with dev traffic, skews metrics
- **Using `person_profiles: 'always'`:** Creates user profiles for all visitors, potential privacy issue and cost increase
- **Calling `posthog.identify()` with email/name:** Violates anonymous-only requirement, sends PII to third party
- **Not wrapping PostHogPageView in Suspense:** Causes hydration errors with `useSearchParams` in Next.js
- **Loading PostHog on server:** PostHog is client-only, must use `'use client'` directive

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Analytics tracking | Custom event collection system | PostHog | Cross-device tracking, duplicate event handling, performance optimization, session management all solved |
| Page view tracking | Custom route change listener | PostHog `$pageview` events | Handles SPA navigation, back/forward buttons, query param changes, duplicate prevention |
| Ad-blocker bypass | Custom domain proxy logic | PostHog reverse proxy guide | Cookie handling, CORS, security headers, rate limiting all complex to implement correctly |
| Anonymous user identification | Custom hash/fingerprinting | PostHog anonymous IDs | Privacy-compliant, handles cookie restrictions, daily rotation for privacy |
| Event deduplication | Custom event ID system | PostHog built-in deduplication | Server-side deduplication, idempotency keys, handles retries |

**Key insight:** Product analytics seems simple (just send events) but has massive complexity: duplicate events, session tracking across tabs, handling offline/online transitions, GDPR compliance, ad-blocker detection, cross-device tracking. PostHog solves all of this out-of-box.

## Common Pitfalls

### Pitfall 1: Hydration Errors with PostHogPageView
**What goes wrong:** "Text content does not match server-rendered HTML" or "Prop dangerouslySetInnerHTML did not match" errors in console
**Why it happens:** PostHogPageView uses `useSearchParams()` which requires Suspense boundary in Next.js 15. Additionally, PostHog loads remote config by injecting script tags, causing client/server mismatch.
**How to avoid:**
1. Always wrap PostHogPageView in `<Suspense fallback={null}>`
2. Consider adding `disable_external_dependency_loading: true` to PostHog config (disables surveys but prevents script injection hydration issues)
**Warning signs:** Console errors mentioning hydration, dangerouslySetInnerHTML, or mismatched attributes
**Source:** [Next.js + Sentry + PostHog integration hydration error](https://github.com/PostHog/posthog-js/issues/1645), [Next.js Hydration Errors in 2026](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702)

### Pitfall 2: Middleware Reverse Proxy Cookie Forwarding
**What goes wrong:** Authentication cookies forwarded to PostHog API, potential security leak
**Why it happens:** Next.js middleware proxies requests with ALL cookies from the original request, including session tokens
**How to avoid:**
1. If using middleware proxy, strip sensitive cookies before forwarding
2. Prefer rewrites over middleware unless rewrites fail on your host
3. Use non-obvious path name (not /ingest, /analytics, /tracking - these get blocked)
**Warning signs:** PostHog receiving unexpected cookies, auth tokens visible in network requests to PostHog
**Source:** [Using Next.js middleware as a reverse proxy](https://posthog-com.translate.goog/docs/advanced/proxy/nextjs-middleware), [How to setup analytics w/ Posthog on Next.js](https://www.johnnyle.io/read/analytics)

### Pitfall 3: Missing Page Views on Route Changes
**What goes wrong:** Page views only tracked on hard refresh, not on client-side navigation
**Why it happens:** Forgot to implement PostHogPageView component, or didn't disable `capture_pageview`
**How to avoid:**
1. Set `capture_pageview: false` in PostHog config
2. Implement PostHogPageView component with usePathname/useSearchParams
3. Add PostHogPageView to layout, inside PostHogProvider
**Warning signs:** Page view count much lower than expected, views only increment on page refresh
**Source:** [PostHog integration in Next.JS App Router](https://reetesh.in/blog/posthog-integration-in-next.js-app-router)

### Pitfall 4: Development Data Polluting Production Analytics
**What goes wrong:** Local dev pageviews show up in production dashboard, metrics are meaningless
**Why it happens:** PostHog initialized without environment check, runs in all environments
**How to avoid:**
1. Always check `process.env.VERCEL_ENV === 'production'` before initialization
2. Return early from provider if not production
3. Use `NEXT_PUBLIC_POSTHOG_KEY` only in production environment variables
**Warning signs:** Unusual traffic patterns, localhost URLs in page view data, test events in production
**Source:** [Using PostHog with the Next.js App Router and Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics)

### Pitfall 5: Accidentally Sending PII in Event Properties
**What goes wrong:** User emails, names, IP addresses sent to PostHog in custom events
**Why it happens:** Including user objects directly in event properties without sanitization
**How to avoid:**
1. Never call `posthog.identify()` with anonymous tracking
2. Use IDs only in event properties (user_id, client_id, invoice_id)
3. Create typed event helpers that enforce property structure
4. Code review all `posthog.capture()` calls for PII
**Warning signs:** PostHog person profiles contain email/name fields, GDPR concerns raised
**Source:** [PostHog in Practice: Data Pipelines](https://bix-tech.com/posthog-in-practice-how-to-build-data-pipelines-and-unlock-user-behavior-analytics/)

## Code Examples

Verified patterns from official sources and community implementations:

### Environment-Gated Production Check (matches existing pattern)
```typescript
// src/lib/analytics/posthog.ts
/**
 * Production environment check.
 * Uses VERCEL_ENV for proper Vercel environment detection.
 * Matches pattern from src/lib/logging/axiom.ts
 */
export const isProduction = process.env.VERCEL_ENV === 'production';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
```

### Complete Provider Integration
```typescript
// src/contexts/posthog-provider.tsx
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect, type ReactNode } from 'react'
import { isProduction, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/analytics/posthog'

export function PHProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only initialize in production with valid credentials
    if (isProduction && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,

        // Privacy-first configuration
        person_profiles: 'identified_only',  // No profiles for anonymous users
        disable_session_recording: true,     // No session replays

        // Manual page view tracking (required for App Router)
        capture_pageview: false,
        capture_pageleave: true,

        // Optional: prevent hydration issues
        disable_external_dependency_loading: true,
      })
    }
  }, [])

  // Development or missing credentials: pass through without PostHog
  if (!isProduction || !POSTHOG_KEY) {
    return <>{children}</>
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

### Layout Integration with Existing Providers
```typescript
// src/app/layout.tsx
import { Suspense } from 'react'
import { Providers } from '@/contexts/providers'
import { PHProvider } from '@/contexts/posthog-provider'
import { PostHogPageView } from '@/components/analytics/posthog-pageview'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PHProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            {children}
          </PHProvider>
        </Providers>
      </body>
    </html>
  )
}
```

### Page View Tracking Component
```typescript
// src/components/analytics/posthog-pageview.tsx
'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    // Track page view on route change
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }

      posthog.capture('$pageview', {
        $current_url: url
      })
    }
  }, [pathname, searchParams, posthog])

  return null
}
```

### Type-Safe Custom Event Tracking (optional enhancement)
```typescript
// src/lib/analytics/events.ts
import posthog from 'posthog-js'
import { isProduction } from './posthog'

// Type-safe event tracking helpers
type InvoiceCreatedProps = {
  invoice_id: string
  client_id: string
  amount: number
  currency: string
}

type TimeEntryCreatedProps = {
  entry_id: string
  project_id: string
  duration_minutes: number
}

// Centralized event tracking with validation
export const analytics = {
  invoiceCreated: (props: InvoiceCreatedProps) => {
    if (!isProduction) return
    posthog.capture('invoice_created', props)
  },

  timeEntryCreated: (props: TimeEntryCreatedProps) => {
    if (!isProduction) return
    posthog.capture('time_entry_created', props)
  },

  // Add more events as needed
}

// Usage:
// analytics.invoiceCreated({
//   invoice_id: 'inv_123',
//   client_id: 'cli_456',
//   amount: 1000,
//   currency: 'USD'
// })
```

## Reverse Proxy Patterns (Deferred)

**Note:** Reverse proxy implementation should be deferred until ad-blocker issues are confirmed in production. Start without proxy, add only if needed.

### Option 1: Next.js Rewrites (Recommended if needed)
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/ph-ingest/:path*',  // Non-obvious path name
        destination: 'https://app.posthog.com/:path*',
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

// Update PostHog config:
posthog.init(POSTHOG_KEY, {
  api_host: '/ph-ingest',  // Use rewrite path
  ui_host: 'https://app.posthog.com',
  // ... other config
})
```
**Source:** [How to setup analytics w/ Posthog on Next.js](https://www.johnnyle.io/read/analytics)

### Option 2: Middleware Reverse Proxy (If rewrites fail)
```typescript
// src/middleware.ts - ADD to existing middleware
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // PostHog reverse proxy
  if (request.nextUrl.pathname.startsWith('/ph-ingest')) {
    const url = new URL(request.nextUrl.pathname, 'https://app.posthog.com')
    url.search = request.nextUrl.search

    // Strip sensitive cookies before forwarding
    const headers = new Headers(request.headers)
    headers.delete('cookie')  // Remove ALL cookies for security
    headers.set('host', 'app.posthog.com')

    return NextResponse.rewrite(url, { request: { headers } })
  }

  // Existing middleware logic...
}

export const config = {
  matcher: [
    '/ph-ingest/:path*',  // Add PostHog proxy path
    // ... existing matchers
  ],
}
```
**WARNING:** Carefully test middleware matcher conflicts with existing rate limiting and auth middleware.
**Source:** [Using Next.js middleware as a reverse proxy](https://posthog-com.translate.goog/docs/advanced/proxy/nextjs-middleware)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Auto-capture pageviews | Manual tracking with usePathname | Next.js 13+ App Router (2023) | Required pattern change for all App Router apps |
| `person_profiles: 'always'` default | `person_profiles: 'identified_only'` | PostHog v3 (2024) | Better privacy defaults, lower costs |
| Pages Router `/pages/_app.tsx` | App Router `/app/layout.tsx` | Next.js 13+ (2023) | Different provider integration point |
| Single PostHog instance | Multi-environment projects | PostHog Jan 2026 | Can now separate dev/prod data within same project |
| NODE_ENV for environment detection | VERCEL_ENV | Vercel best practices | More accurate environment detection (preview vs production) |

**Deprecated/outdated:**
- **Using PostHog with Pages Router patterns:** PostHog docs still show Pages Router examples, but App Router is current Next.js standard (as of Next.js 15)
- **Automatic pageview capture in SPAs:** Doesn't work reliably with modern frameworks, manual tracking is standard
- **Cookie-based tracking without consent:** GDPR enforcement means anonymous-by-default or cookieless mode required in EU

## Open Questions

1. **Middleware matcher conflicts**
   - What we know: Existing middleware has matchers for auth/rate limiting, PostHog proxy needs additional matcher
   - What's unclear: Whether PostHog proxy path will conflict with existing matchers, whether rate limiter should apply to PostHog requests
   - Recommendation: Start without reverse proxy, only add if ad-blocker issues confirmed in production. If needed, use rewrites first before middleware approach.

2. **Custom event tracking scope**
   - What we know: Phase 3 requirements only specify page view tracking
   - What's unclear: Whether custom events (invoice created, timer started, etc.) are in scope for Phase 3 or future phase
   - Recommendation: Implement infrastructure (typed event helpers) in Phase 3, defer actual event capture calls to future phases when features are instrumented.

3. **PostHog project environments**
   - What we know: PostHog now supports multiple environments within same project (Jan 2026 feature)
   - What's unclear: Whether to use single production-only project or multi-environment setup
   - Recommendation: Start with single production-only project for simplicity, can add dev/preview environments later if needed.

## Sources

### Primary (HIGH confidence)
- [posthog-js npm package](https://www.npmjs.com/package/posthog-js) - Latest version 1.343.0 (Feb 2026)
- [PostHog GitHub Releases](https://github.com/PostHog/posthog-js/releases) - Current versions and changelogs
- [GDPR compliant posthog tracking without consent](https://www.psimms.de/posts/gdpr-compliant-posthog-tracking-without-consent/) - Privacy configuration details
- [PostHog integration in Next.JS App Router](https://reetesh.in/blog/posthog-integration-in-next.js-app-router) - Comprehensive App Router guide

### Secondary (MEDIUM confidence)
- [Using PostHog with the Next.js App Router and Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics) - Official Vercel integration guide
- [PostHog NextJS 15 — How to add web analytics](https://medium.com/@alexjamesdunlop/posthog-nextjs-15-how-to-add-web-analytics-49453b618c30) - Recent Next.js 15 specific guide
- [How to setup analytics w/ Posthog on Next.js](https://www.johnnyle.io/read/analytics) - Community implementation guide
- [Building Production Analytics with PostHog](https://hboon.com/building-production-analytics-with-posthog-a-complete-implementation-guide/) - Production best practices
- [PostHog in Practice: Data Pipelines](https://bix-tech.com/posthog-in-practice-how-to-build-data-pipelines-and-unlock-user-behavior-analytics/) - PII prevention strategies

### Tertiary (LOW confidence - needs validation)
- PostHog official docs (WebFetch failed to retrieve actual content, only saw CSS)
- Exact middleware cookie stripping implementation (mentioned in sources but not fully detailed)
- PostHog multi-environment projects (very recent feature, limited documentation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PostHog is well-established, npm package actively maintained, clear version information
- Architecture patterns: MEDIUM-HIGH - Multiple consistent sources showing same patterns, but PostHog official docs not fully verified
- Privacy configuration: MEDIUM - Multiple sources confirm `person_profiles: 'identified_only'` approach, but some details from community sources only
- Reverse proxy: MEDIUM - Clear documentation exists but security implications and middleware conflicts need testing
- Pitfalls: HIGH - Specific GitHub issues document problems, multiple sources report same issues

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (30 days - stable domain, PostHog actively maintained but patterns unlikely to change rapidly)

**Key uncertainties requiring validation during implementation:**
1. Exact middleware matcher configuration to avoid conflicts
2. PostHog official documentation verification (WebFetch retrieval failed)
3. Production verification that anonymous tracking truly sends zero PII
4. Actual need for reverse proxy (may not be required if ad-blockers don't cause issues)
