# Stack Research

**Domain:** Observability & Analytics Integration for Next.js SaaS
**Researched:** 2026-02-11
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **@axiomhq/nextjs** | ^0.2.0 | Next.js-specific logging helpers for middleware, route handlers, server-side logging | Official Axiom Next.js integration, part of reimagined 2026 logging ecosystem. Replaces deprecated `next-axiom`. Designed specifically for Next.js App Router with Edge Runtime support. |
| **@axiomhq/react** | ^0.2.0 | React hooks and components for client-side logging | Provides React-specific logging primitives, works with React 18 & 19. Part of modular Axiom architecture. |
| **@axiomhq/logging** | ^0.2.0 | Framework-agnostic logging core | Required peer dependency for `@axiomhq/react` and `@axiomhq/nextjs`. Handles fundamentals, supports multiple transports. |
| **posthog-js** | ^1.345.4 | Client-side product analytics | Industry-standard client-side SDK. 1.3M weekly downloads. Actively maintained with frequent updates (last updated Feb 11, 2026). Feature-complete with autocapture, feature flags, session recording. |
| **posthog-node** | ^5.24.15 (optional) | Server-side feature flags and analytics | Only needed if implementing server-side feature flags in React Server Components. Not required for basic analytics. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **pino** | ^10.3.1 (optional) | High-performance structured logging | If you need local structured logging in addition to Axiom. Recommended for development pretty-printing. Performance-oriented (minimal overhead). |
| **winston** | ^3.19.0 (avoid) | Feature-rich logging library | DO NOT USE with Axiom. Axiom's new architecture eliminates need for Winston transport pattern. Winston adds unnecessary complexity. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Axiom CLI | Dataset management, testing | Install via `npm install -g @axiomhq/cli`. Useful for testing log ingestion during development. |
| PostHog Feature Flags Dashboard | A/B testing, gradual rollouts | Web interface for managing flags. No CLI needed. |

## Installation

```bash
# Axiom Logging Stack
npm install @axiomhq/nextjs @axiomhq/react @axiomhq/logging

# PostHog Analytics
npm install posthog-js

# Optional: PostHog Server-Side (only if needed)
npm install posthog-node

# Optional: Local Structured Logging for Development
npm install pino pino-pretty
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Axiom** | Datadog | When you need comprehensive APM, infrastructure monitoring, security tools, and have budget for enterprise pricing. Overkill for backend logging alone. |
| **Axiom** | Sentry | When error tracking and stack traces are more important than general observability. Sentry excels at error grouping but lacks comprehensive log aggregation. Use both together if budget permits. |
| **Axiom** | Vercel Log Drains | When you only need basic log viewing and don't require search, analytics, or retention policies. Free but limited functionality. |
| **PostHog** | Mixpanel | When non-technical teams need simple point-and-click analytics. Lacks autocapture, requires manual event setup. More expensive at scale. |
| **PostHog** | Amplitude | When marketing teams need advanced visualizations. Less developer-friendly, higher cost, less transparent pricing. Better for large marketing-driven orgs. |
| **PostHog** | Google Analytics 4 | Never for product analytics. GA4 is for marketing/traffic analytics, not product insights. Lacks session replay, feature flags, user-level tracking. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **next-axiom** | Deprecated as of 2026. No new features, only bug fixes. Uses environment variable magic and lacks modular architecture. | **@axiomhq/nextjs** (official replacement) |
| **console.log/error in production** | Unstructured, no aggregation, poor searchability, performance overhead. Lost on serverless after execution. | **@axiomhq/logging** with Axiom transport |
| **Winston + Axiom Transport** | Old pattern from `next-axiom` era. New Axiom libs eliminate need for Winston layer. Adds complexity and dependencies. | **@axiomhq/logging** directly (built-in transport system) |
| **@posthog/nextjs** | Experimental package (v0.0.3, released Nov 2025). Very new, limited adoption. Not production-ready. | **posthog-js** (mature, stable, well-documented) |
| **Self-hosted PostHog** | Requires infrastructure maintenance, database management, updates. Overkill unless strict data sovereignty required (GDPR compliance achievable with cloud version). | **PostHog Cloud** with proper configuration |
| **Multiple analytics tools** | Tool sprawl leads to data inconsistency, higher costs, integration overhead. PostHog covers product analytics, feature flags, session replay. | **PostHog only** (consolidate onto single platform) |

## Stack Patterns by Variant

### Pattern 1: Production-Only Observability (Recommended for BillMint)

**When:** You want zero observability overhead in development, full logging in production.

**Implementation:**
```typescript
// lib/logger.ts
import { Logger } from '@axiomhq/nextjs';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = isProduction
  ? new Logger({
      dataset: process.env.AXIOM_DATASET!,
      token: process.env.AXIOM_TOKEN!
    })
  : {
      // No-op logger for development
      info: () => {},
      error: () => {},
      warn: () => {},
      debug: () => {},
    };
```

**Why:** Keeps dev console clean, reduces costs, prevents test data pollution in Axiom.

### Pattern 2: Dual-Mode Logging (Development + Production)

**When:** You want structured logs in both dev and production.

**Implementation:**
```typescript
// lib/logger.ts
import { Logger } from '@axiomhq/logging';
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = isProduction
  ? new Logger({
      dataset: process.env.AXIOM_DATASET!,
      token: process.env.AXIOM_TOKEN!,
    })
  : pino({
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    });
```

**Why:** Consistent logging API, pretty-printed dev logs, Axiom-ingested production logs.

### Pattern 3: PostHog with Reverse Proxy (Bypass Ad Blockers)

**When:** You need reliable analytics that bypass browser privacy tools.

**Implementation:**
```typescript
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://us.i.posthog.com/decide',
      },
    ];
  },
};

// providers/posthog.tsx
posthog.init(POSTHOG_KEY, {
  api_host: '/ingest', // Use local proxy
  ui_host: 'https://us.posthog.com',
});
```

**Why:** Routes analytics through your domain instead of posthog.com, avoiding ad blocker filter lists. Use obscure path names (not `/analytics` or `/tracking`).

### Pattern 4: Anonymous Analytics (GDPR-Friendly)

**When:** You want insights without collecting PII (BillMint requirement).

**Implementation:**
```typescript
posthog.init(POSTHOG_KEY, {
  api_host: '/ingest',
  persistence: 'memory', // Don't persist across sessions
  disable_session_recording: true,
  autocapture: {
    dom_event_allowlist: [], // No DOM autocapture
    url_allowlist: ['/dashboard/*'], // Limit scope
  },
  sanitize_properties: (properties) => {
    // Remove any PII
    const sanitized = { ...properties };
    delete sanitized.email;
    delete sanitized.$initial_referrer;
    delete sanitized.$initial_referring_domain;
    return sanitized;
  },
});
```

**Why:** Complies with GDPR without consent banners. Tracks product usage, not users.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @axiomhq/nextjs@0.2.0 | Next.js 14-16, Edge Runtime | Tested with App Router. Middleware support confirmed. |
| @axiomhq/react@0.2.0 | React 18 & 19 | Peer dependency: `react ^18 \|\| ^19` |
| @axiomhq/logging@0.2.0 | Node.js 18+ | Peer dependency: `@axiomhq/js@1.4.0` (installed automatically) |
| posthog-js@1.345.4 | Next.js 12-16, React 17-19 | Framework-agnostic. Works with App Router and Pages Router. |
| posthog-node@5.24.15 | Node.js 18+ | Server-side only. Not compatible with Edge Runtime. |

**Critical:** Do NOT mix `next-axiom` with `@axiomhq/nextjs`. They conflict. Remove `next-axiom` completely before installing new packages.

## Architecture Recommendations

### Logging Strategy

1. **Replace console.error calls systematically**
   - BillMint has 69 `console.error` calls across 14 service files
   - Create centralized logger utility (`lib/logger.ts`)
   - Replace service-by-service (auth → billing → invoice → email)
   - Add structured context: `logger.error('msg', { userId, action, error })`

2. **Add structured fields consistently**
   - **service**: Which service file (e.g., 'auth', 'billing')
   - **action**: What operation (e.g., 'createInvoice', 'processPayment')
   - **userId**: Anonymous user ID (hash or Supabase UUID)
   - **error**: Full error object with stack trace
   - **duration**: Operation timing (for performance monitoring)

3. **Log levels**
   - **error**: User-facing errors, payment failures, auth issues
   - **warn**: Degraded behavior, retry attempts, fallbacks
   - **info**: Business events (invoice sent, subscription created)
   - **debug**: Development diagnostics (not sent to Axiom in prod)

### Analytics Strategy

1. **Event Taxonomy**
   - **Page views**: Automatic via PostHog (no manual tracking)
   - **Feature usage**: Manual events (e.g., 'invoice_created', 'time_entry_logged')
   - **Business metrics**: Revenue events (e.g., 'subscription_upgraded')
   - **Product health**: Error rates, feature adoption

2. **Property Standards**
   - **User properties**: tier (free/paid), signup_date, plan_name
   - **Event properties**: feature_name, value (for revenue), duration
   - **No PII**: No emails, no names, no IP addresses

3. **Implementation Approach**
   - Client-side: User interactions, page views, feature clicks
   - Server-side: Business events (subscription changes, payments)
   - Both: Cross-reference with anonymous user ID

## Environment Variables

```bash
# Axiom (Production Only)
AXIOM_TOKEN=xaat-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AXIOM_DATASET=billmint-production

# PostHog (Production Only)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.posthog.com

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true  # Master switch
NODE_ENV=production  # Auto-set by Vercel/hosting
```

**Security Notes:**
- Axiom token: Server-side only (no `NEXT_PUBLIC_` prefix)
- PostHog key: Client-side safe (public key, not secret)
- Use different datasets/projects for staging vs production

## Migration Path from Console Logging

### Phase 1: Foundation (Week 1)
1. Install Axiom packages
2. Create `lib/logger.ts` with production-only conditional
3. Set up Axiom dataset and environment variables
4. Replace console.error in one service file (e.g., `auth.service.ts`)
5. Deploy and verify logs appear in Axiom

### Phase 2: Service Migration (Week 2-3)
1. Replace console.error in high-value services:
   - `billing.service.ts` (payment errors critical)
   - `invoice.service.ts` (business logic)
   - `email.service.ts` (delivery failures)
2. Add structured context to each log
3. Create Axiom monitors for critical errors

### Phase 3: Analytics (Week 4)
1. Install PostHog
2. Set up reverse proxy in `next.config.ts`
3. Create PostHog provider component
4. Add manual events for key features (5-10 events max)
5. Set up dashboard for product metrics

### Phase 4: Advanced (Week 5+)
1. Add request/response logging to middleware
2. Create error aggregation dashboard in Axiom
3. Implement PostHog feature flags (if needed)
4. Set up alerts for critical errors

## Cost Estimates

### Axiom
- **Free tier:** 0.5 GB/month ingestion, 30-day retention
- **Estimated usage:** 1-2 GB/month (72 console.error calls + structured logs)
- **Projected cost:** $0-25/month (likely within free tier initially)
- **Cost optimization:** Log only errors in production, not info/debug

### PostHog
- **Free tier:** 1M events/month, 5K session recordings/month
- **Estimated usage:** 50K-200K events/month (small SaaS)
- **Projected cost:** $0/month (well within free tier)
- **Cost optimization:** Disable session recording, limit autocapture scope

**Total:** $0-25/month (likely $0 for first 6 months)

## Sources

### Official Documentation (HIGH confidence)
- [Axiom Next.js Integration](https://axiom.co/docs/send-data/nextjs) — Official setup guide
- [Axiom New JS Logging Libraries Blog](https://axiom.co/blog/new-js-logging) — 2026 architecture announcement
- [PostHog Next.js App Router with Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics) — Verified setup guide
- [Next.js Logging Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging) — Framework logging patterns

### Package Registries (HIGH confidence)
- [@axiomhq/nextjs on npm](https://www.npmjs.com/package/@axiomhq/nextjs) — Version 0.2.0 (Jan 27, 2026)
- [posthog-js on npm](https://www.npmjs.com/package/posthog-js) — Version 1.345.4 (Feb 11, 2026)
- [pino on npm](https://www.npmjs.com/package/pino) — Version 10.3.1 (current)

### Comparison & Best Practices (MEDIUM confidence)
- [Datadog vs Sentry Comparison 2026](https://betterstack.com/community/comparisons/datadog-vs-sentry/) — Feature comparison
- [Axiom Alternatives Analysis](https://signoz.io/comparisons/axiom-alternatives/) — When to use Axiom vs competitors
- [PostHog vs Mixpanel vs Amplitude](https://www.brainforge.ai/resources/amplitude-vs-mixpanel-vs-posthog) — Product analytics comparison
- [Structured Logging for Next.js](https://blog.arcjet.com/structured-logging-in-json-for-next-js/) — Next.js logging patterns
- [Pino Logger Guide 2026](https://signoz.io/guides/pino-logger/) — Performance-focused logging

### Implementation Guides (MEDIUM confidence)
- [PostHog Reverse Proxy with Next.js](https://medium.com/@vivek563maurya/how-to-use-reverse-proxy-for-posthog-in-nextjs-page-router-cb96b59d6ed9) — Ad blocker bypass
- [GDPR-Compliant PostHog Tracking](https://www.psimms.de/posts/gdpr-compliant-posthog-tracking-without-consent/) — Anonymous analytics
- [Axiom Edge Runtime Middleware](https://axiom.co/changelog/nextjs-middleware) — Next.js middleware support
- [Node.js Logging Best Practices 2026](https://nareshit.com/blogs/nodejs-logging-best-practices-winston-morgan-pino) — Pino vs Winston

---
*Stack research for: BillMint Observability & Analytics*
*Researched: 2026-02-11*
*Context: Replacing 72 console statements with production logging and adding anonymous product analytics*
