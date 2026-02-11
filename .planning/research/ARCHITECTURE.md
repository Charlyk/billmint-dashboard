# Architecture Research

**Domain:** Observability & Analytics Integration (Axiom + PostHog)
**Researched:** 2026-02-11
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer (Browser)                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ PostHog      │  │ useLogger    │  │ User Components          │   │
│  │ Provider     │  │ Hook (Axiom) │  │ (posthog.capture())      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘   │
│         │                 │                      │                   │
│         │ (analytics)     │ (logs)               │ (events)          │
│         ↓                 ↓                      ↓                   │
├─────────┴─────────────────┴──────────────────────┴───────────────────┤
│                         Next.js Middleware                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Auth Check   │  │ Axiom Logger │  │ Request Context          │   │
│  │ (existing)   │  │ middleware() │  │ (user_id, trace_id)      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘   │
│         │                 │                      │                   │
├─────────┴─────────────────┴──────────────────────┴───────────────────┤
│                         API Routes Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ withAxiom() Wrapper + PostHog Backend Tracking               │   │
│  │  - Auto error logging                                        │   │
│  │  - Request/response logging                                  │   │
│  │  - Business event capture (timer, invoice, billing)          │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             ↓                                        │
├─────────────────────────────────────────────────────────────────────┤
│                         Service Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────────────┐     │
│  │ Logger  │  │ Timer   │  │ Invoice │  │ Billing            │     │
│  │ Utility │  │ Service │  │ Service │  │ Service            │     │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬───────────────┘     │
│       │            │             │            │                     │
│       │ (structured logging with context)    │                     │
│       │            │             │            │                     │
├───────┴────────────┴─────────────┴────────────┴─────────────────────┤
│                    External Services                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Axiom API    │  │ PostHog API  │  │ Existing (Supabase,      │   │
│  │ (logs)       │  │ (events)     │  │ Stripe, Resend)          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **PostHog Provider** | Initialize analytics SDK on client, provide context to child components | Client component wrapping root layout, uses `posthog-js` |
| **PostHog Pageview Tracker** | Capture page navigation events in App Router | Client component using `usePathname()` and `useSearchParams()` hooks |
| **Axiom Logger Utility** | Centralized structured logging interface for services | Singleton pattern, wraps `@axiomhq/nextjs` Logger class |
| **Axiom Middleware** | Capture request metadata (user_id, method, path, duration) | Extends existing middleware.ts, calls `logger.middleware(request)` |
| **withAxiom() Wrapper** | Auto-instrument API routes with logging and error capture | Higher-order function wrapping route handlers |
| **PostHog Backend Client** | Server-side event tracking for business actions | Singleton pattern, uses `posthog-node` SDK |
| **Analytics Events Module** | Define and track key user actions (timer, invoice, billing CRUD) | Typed event definitions with standardized naming |

## Recommended Project Structure

```
src/
├── lib/
│   ├── observability/          # NEW: Observability layer
│   │   ├── axiom.ts            # Axiom client initialization
│   │   ├── logger.ts           # Logger utility (wraps Axiom)
│   │   ├── posthog.ts          # PostHog server client
│   │   └── index.ts            # Re-exports
│   ├── analytics/              # NEW: Analytics layer
│   │   ├── events.ts           # Event type definitions
│   │   ├── track.ts            # Track helper functions
│   │   └── constants.ts        # Event names as constants
│   ├── services/               # EXISTING: Service layer (14 files)
│   │   ├── auth.service.ts     # Replace console.error with logger
│   │   ├── billing.service.ts  # Add PostHog tracking
│   │   ├── invoice.service.ts  # Add PostHog tracking
│   │   ├── timer.service.ts    # Add PostHog tracking
│   │   └── ...                 # Other services
│   └── utils/
│       └── errors.ts           # MODIFY: handleError to use logger
├── contexts/
│   ├── providers.tsx           # MODIFY: Add PostHog provider
│   └── ...                     # Existing contexts
├── components/
│   ├── analytics/              # NEW: Analytics components
│   │   ├── posthog-pageview.tsx   # Pageview tracker
│   │   └── posthog-provider.tsx   # Client provider wrapper
│   └── ...
├── middleware.ts               # MODIFY: Add Axiom logging
└── app/
    ├── layout.tsx              # MODIFY: Add PostHog provider
    └── api/
        ├── axiom/              # NEW: Optional proxy endpoint
        │   └── route.ts        # Proxy client logs to Axiom
        └── **/route.ts         # MODIFY: Wrap with withAxiom()
```

### Structure Rationale

- **lib/observability/**: Centralized logging infrastructure, isolated from business logic. Services import from this layer, creating clear dependency boundaries.
- **lib/analytics/**: Separates event definitions from tracking implementation. Enables type-safe event tracking and prevents event name typos.
- **components/analytics/**: Client-side analytics components marked with `'use client'`, keeping server components pure.
- **Proxy endpoint (optional)**: For production security, routes client-side logs through your domain, avoiding ad-blockers and exposing fewer credentials to the browser.

## Architectural Patterns

### Pattern 1: Centralized Logger Utility

**What:** Single logger module that abstracts Axiom implementation details, provides consistent structured logging interface across all services.

**When to use:** Replacing 35+ console.error calls, adding context-rich logging to services, tracking errors in API routes.

**Trade-offs:**
- **Pro:** Single point of configuration, easy to swap observability providers, enforces structured logging consistency
- **Con:** Adds indirection layer, requires service refactoring

**Example:**
```typescript
// lib/observability/logger.ts
import { Logger } from '@axiomhq/nextjs'

class AppLogger {
  private logger: Logger

  constructor() {
    this.logger = new Logger({
      dataset: process.env.AXIOM_DATASET!,
    })
  }

  error(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(message, context)
      this.logger.flush() // Async flush
    } else {
      console.error(message, context)
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'production') {
      this.logger.info(message, context)
      this.logger.flush()
    } else {
      console.log(message, context)
    }
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(message, context)
      this.logger.flush()
    } else {
      console.warn(message, context)
    }
  }
}

export const logger = new AppLogger()
```

### Pattern 2: Route Handler Instrumentation with withAxiom

**What:** Higher-order function that wraps API route handlers to automatically log requests, responses, and errors.

**When to use:** All API routes (50+ routes in src/app/api/), especially those with error handling or critical business logic.

**Trade-offs:**
- **Pro:** Automatic error capture, consistent request/response logging, zero-boilerplate logging per route
- **Con:** Adds minimal overhead to each request (~5-10ms), requires wrapping pattern adoption

**Example:**
```typescript
// src/app/api/timer/start/route.ts
import { withAxiom } from '@axiomhq/nextjs'
import { startTimer } from '@/lib/services/timer.service'

export const POST = withAxiom(async (request) => {
  // logger available as request.log
  request.log.info('Timer start requested')

  const body = await request.json()
  const timer = await startTimer(body)

  request.log.info('Timer started', { timer_id: timer.id })
  return Response.json({ data: timer }, { status: 201 })
})
```

### Pattern 3: Dual-Client Analytics (Client + Server)

**What:** Use PostHog browser SDK for client-side navigation and interactions, PostHog Node SDK for server-side business events.

**When to use:** Track both user interface interactions (page views, clicks) and backend business logic (invoice created, subscription changed).

**Trade-offs:**
- **Pro:** Complete event coverage (client + server), server events can't be blocked by ad-blockers, captures business logic not visible to client
- **Con:** Two SDK instances to manage, requires distinct event naming to identify source

**Example:**
```typescript
// Client-side (components)
import { usePostHog } from 'posthog-js/react'

export function TimerButton() {
  const posthog = usePostHog()

  const handleStart = () => {
    posthog.capture('timer_started', {
      source: 'dashboard',
      project_id: projectId
    })
  }
}

// Server-side (services)
import { posthog } from '@/lib/analytics/posthog'

export async function createInvoice(data: InvoiceData) {
  const invoice = await db.invoice.create(data)

  posthog.capture({
    distinctId: data.user_id,
    event: 'invoice_created',
    properties: {
      invoice_id: invoice.id,
      amount: invoice.total,
      currency: invoice.currency
    }
  })

  await posthog.shutdown() // Flush before returning
  return invoice
}
```

### Pattern 4: Production-Only Logging

**What:** Environment-gated logging that only sends data to Axiom/PostHog in production, falling back to console in development.

**When to use:** All logging and analytics calls to avoid polluting production data with dev/test activity.

**Trade-offs:**
- **Pro:** Clean production data, no cost in dev, faster local development (no network calls)
- **Con:** Can't test full integration locally, requires staging environment for validation

**Example:**
```typescript
// lib/observability/logger.ts
export const logger = {
  error: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') {
      axiomLogger.error(message, context)
    } else {
      console.error(`[ERROR] ${message}`, context)
    }
  }
}

// lib/analytics/posthog.ts
export const posthog = process.env.NODE_ENV === 'production'
  ? new PostHog(
      process.env.NEXT_PUBLIC_POSTHOG_KEY!,
      { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
    )
  : null

export const track = (event: string, properties?: Record<string, unknown>) => {
  if (posthog) {
    posthog.capture({ event, ...properties })
  } else {
    console.log(`[ANALYTICS] ${event}`, properties)
  }
}
```

### Pattern 5: Structured Context Propagation

**What:** Pass contextual metadata (user_id, request_id, trace_id) through the request lifecycle for correlation.

**When to use:** Middleware captures initial context, API routes and services append additional context, all logs include correlation IDs.

**Trade-offs:**
- **Pro:** Easy to trace requests across distributed logs, enables debugging complex flows, supports request replay
- **Con:** Requires passing context through function calls or using async context (AsyncLocalStorage)

**Example:**
```typescript
// middleware.ts
import { logger } from '@/lib/observability/logger'

export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID()

  // Log request entry
  logger.info('Request received', {
    request_id: requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    user_agent: request.headers.get('user-agent')
  })

  const response = await updateSession(request)

  // Attach request_id to response header for client correlation
  response.headers.set('x-request-id', requestId)

  return response
}

// API route
export const POST = withAxiom(async (request) => {
  const requestId = request.headers.get('x-request-id')

  try {
    const result = await service.doSomething()

    request.log.info('Operation succeeded', {
      request_id: requestId,
      result_id: result.id
    })

    return Response.json({ data: result })
  } catch (error) {
    request.log.error('Operation failed', {
      request_id: requestId,
      error: error.message
    })
    throw error
  }
})
```

## Data Flow

### Axiom Logging Flow

```
Service Error
    ↓
logger.error(message, context)
    ↓
[Production Check]
    ↓ YES
Axiom Logger Instance
    ↓
logger.flush() (async)
    ↓
Batched to Axiom API
    ↓ NO (development)
console.error(message, context)
```

### Request Logging Flow

```
User Request
    ↓
Next.js Middleware
    ↓
logger.middleware(request)
    ↓
Capture: user_id, method, path, timestamp
    ↓
API Route Handler (withAxiom wrapper)
    ↓
Service Layer (logger utility)
    ↓
[Success or Error]
    ↓
logger.flush()
    ↓
Axiom Dataset
```

### PostHog Analytics Flow (Client)

```
User Navigation
    ↓
Next.js usePathname() / useSearchParams()
    ↓
PostHogPageView Component
    ↓
posthog.capture('$pageview', { path, params })
    ↓
[via reverse proxy /ingest/*]
    ↓
PostHog API

User Action (button click, form submit)
    ↓
Component Event Handler
    ↓
posthog.capture('event_name', properties)
    ↓
[via reverse proxy /ingest/*]
    ↓
PostHog API
```

### PostHog Analytics Flow (Server)

```
Business Event (invoice created, timer started)
    ↓
Service Layer Function
    ↓
posthog.capture({ distinctId, event, properties })
    ↓
posthog.shutdown() / await flush
    ↓
PostHog API (direct from server)
```

### Key Data Flows

1. **Error Flow:** Service throws → handleError() → logger.error() → Axiom (production) or console (dev)
2. **Request Context:** Middleware → Context object (user_id, trace_id) → withAxiom wrapper → Service logger calls
3. **Business Event:** User action → API route → Service function → PostHog server SDK → PostHog API
4. **Client Navigation:** Route change → PostHogPageView component → PostHog browser SDK → Reverse proxy → PostHog API

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith architecture is fine. Direct Axiom/PostHog integration with basic batching (default 20 logs, 5s interval). Single dataset/project for all logs/events. |
| 1k-100k users | Implement log sampling for high-volume endpoints (e.g., 10% of /api/timer/sync). Use BatchLogRecordProcessor for Axiom (buffers 50-100 logs before flush). Separate PostHog projects for dev/staging/production. Monitor Axiom ingest costs (~$0.25/GB). |
| 100k+ users | Consider separate datasets by service (auth, billing, timer) for cost optimization. Implement dynamic log levels via env vars. Use PostHog sampling (e.g., 50% of pageviews, 100% of conversions). Evaluate Axiom retention policies (30-day for debug, 1-year for errors). |

### Scaling Priorities

1. **First bottleneck:** Axiom ingest volume from high-frequency endpoints (timer sync, auth checks). **Solution:** Add log level filtering (only warn/error) and sampling.
2. **Second bottleneck:** PostHog event volume from pageviews. **Solution:** Sample anonymous users, track all identified users.

## Anti-Patterns

### Anti-Pattern 1: Logging in Client Components with Axiom

**What people do:** Import Axiom logger utility in client components and call it directly from React event handlers.

**Why it's wrong:** Axiom logger requires server context (Node.js runtime). Client components run in browser, causing runtime errors or requiring NEXT_PUBLIC_ API tokens (security risk).

**Do this instead:** Use PostHog for client-side tracking. If logs are critical, send via API route that uses Axiom server-side.

### Anti-Pattern 2: Synchronous Logger Flush in API Routes

**What people do:** Call `await logger.flush()` in every API route handler before returning response.

**Why it's wrong:** Adds 20-50ms latency to every request waiting for Axiom API call. Defeats purpose of async logging.

**Do this instead:** Let `withAxiom` wrapper handle flushing automatically, or use `event.waitUntil()` pattern in middleware to flush after response sent.

### Anti-Pattern 3: Tracking PII in Events

**What people do:** Include user emails, full names, IP addresses in PostHog event properties for "better context".

**Why it's wrong:** GDPR/CCPA violations, data breach risk if PostHog is compromised, unnecessary data storage costs.

**Do this instead:** Use user_id/distinct_id only. Store PII in your database, join via user_id when analyzing. Use PostHog session replay masking for sensitive fields.

### Anti-Pattern 4: Separate console.error AND logger.error Calls

**What people do:**
```typescript
console.error('Failed to send email:', error)
logger.error('Failed to send email:', { error: error.message })
```

**Why it's wrong:** Duplicated logging, inconsistent context between console and Axiom, clutters code.

**Do this instead:** Single logger.error() call that handles both console (dev) and Axiom (prod) internally.

### Anti-Pattern 5: Wrapping Entire App in try-catch for Logging

**What people do:** Add root-level try-catch in layout or API route to "catch all errors".

**Why it's wrong:** Obscures actual error location, loses stack traces, prevents proper error boundaries, catches expected errors (like 404s).

**Do this instead:** Use Next.js 15's `instrumentation.ts` with `onRequestError` hook, or error boundaries per page/component. Let `withAxiom` wrapper catch route-level errors.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Axiom** | Server-side SDK (`@axiomhq/nextjs`) | Middleware + route wrappers + service logger. Requires AXIOM_DATASET and AXIOM_TOKEN env vars. Flush async or with event.waitUntil(). |
| **PostHog** | Dual SDK (browser `posthog-js` + server `posthog-node`) | Provider wrapper in root layout, reverse proxy via next.config.js. Requires NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST. |
| **Supabase** | Existing integration | No changes. Logger can track Supabase errors (e.g., RPC failures). |
| **Stripe** | Existing webhook | Add PostHog tracking for billing events (subscription_created, payment_succeeded). |
| **Resend** | Existing email service | Replace console.error with logger.error for email failures. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Middleware ↔ API Routes** | Request headers (x-request-id, x-user-id) | Middleware attaches context, routes read for correlation. |
| **API Routes ↔ Services** | Direct function calls with logger utility | Services import logger, API routes import services. withAxiom wrapper provides request.log. |
| **Services ↔ Logger** | Import singleton logger | Services call logger.error/info/warn. Logger handles env check internally. |
| **Client Components ↔ PostHog** | usePostHog hook | Client components import hook from PostHogProvider context. |
| **Server Components ↔ PostHog** | Direct import of server SDK | Server components/services import posthog singleton, call capture(), flush before return. |

## Build Order (Dependencies)

### Phase 1: Foundation (No dependencies)
1. **Create logger utility module** (`lib/observability/logger.ts`)
2. **Install Axiom SDK** (`@axiomhq/nextjs`)
3. **Install PostHog SDKs** (`posthog-js`, `posthog-node`)
4. **Add environment variables** to `.env.local` and Vercel

### Phase 2: Axiom Logging (Depends on Phase 1)
1. **Modify middleware.ts** to add Axiom logging
2. **Replace console.error in error handler** (`lib/utils/errors.ts`)
3. **Wrap API routes with withAxiom()** (start with critical routes: auth, billing, timer)
4. **Replace console.error in services** (14 service files)

### Phase 3: PostHog Client Analytics (Depends on Phase 1)
1. **Create PostHog provider component** (`components/analytics/posthog-provider.tsx`)
2. **Create pageview tracker** (`components/analytics/posthog-pageview.tsx`)
3. **Modify root layout** to include PostHog provider
4. **Add reverse proxy** in `next.config.js` (optional but recommended)
5. **Test page navigation tracking**

### Phase 4: PostHog Server Events (Depends on Phase 3)
1. **Define event types** (`lib/analytics/events.ts`)
2. **Create PostHog server client** (`lib/analytics/posthog.ts`)
3. **Add tracking to services** (timer, invoice, billing, client CRUD)
4. **Test event capture in PostHog dashboard**

### Phase 5: Validation & Monitoring (Depends on all phases)
1. **Deploy to production**
2. **Verify logs in Axiom dashboard**
3. **Verify events in PostHog dashboard**
4. **Set up alerts** (error rate spikes in Axiom, conversion funnels in PostHog)
5. **Document event catalog** for team

**Critical path:** Phase 1 → Phase 2 (enables logging) → Phase 3 (enables client analytics) → Phase 4 (enables server analytics)

**Parallel work:** Phase 2 and Phase 3 can be done in parallel after Phase 1 completes.

## Sources

### Axiom Integration
- [Send data from Next.js app to Axiom](https://axiom.co/docs/send-data/nextjs)
- [GitHub - axiomhq/next-axiom](https://github.com/axiomhq/next-axiom)
- [Axiom's new JS logging libraries](https://axiom.co/blog/new-js-logging)
- [@axiomhq/nextjs - npm](https://www.npmjs.com/package/@axiomhq/nextjs)

### PostHog Integration
- [Using PostHog with the Next.js App Router and Vercel](https://vercel.com/kb/guide/posthog-nextjs-vercel-feature-flags-analytics)
- [PostHog integration in Next.JS App Router](https://reetesh.in/blog/posthog-integration-in-next.js-app-router)
- [Building Production Analytics with PostHog](https://hboon.com/building-production-analytics-with-posthog-a-complete-implementation-guide/)
- [Handle multiple environments](https://github.com/PostHog/posthog.com/blob/master/contents/tutorials/multiple-environments.md)

### Next.js Middleware & Observability
- [Next.js Middleware Demystified](https://medium.com/@rameshkannanyt0078/next-js-middleware-demystified-reliable-patterns-for-auth-redirects-and-logging-80d11659340f)
- [Monitor NextJS with OpenTelemetry](https://signoz.io/blog/opentelemetry-nextjs/)
- [Structured Logging in NextJS with OpenTelemetry](https://signoz.io/blog/opentelemetry-nextjs-logging/)

### Structured Logging Best Practices
- [LogLayer: The modern logging library for Typescript](https://loglayer.dev/)
- [Structured logging | LogTape](https://logtape.org/manual/struct)
- [Logger - Powertools for AWS Lambda (TypeScript)](https://docs.aws.amazon.com/powertools/typescript/2.8.0/core/logger/)

### PostHog Event Tracking Patterns
- [PostHog for SaaS: A Practical Guide](https://bix-tech.com/posthog-for-saas-a-practical-guide-to-product-analytics-and-event-tracking/)
- [PostHog Custom Events & Autocapture Events](https://visionlabs.com/academy/posthog/events/)
- [13 Best Event Tracking Tools for SaaS Companies in 2026](https://userpilot.com/blog/event-tracking-tool/)

---
*Architecture research for: Observability & Analytics Integration (Axiom + PostHog)*
*Researched: 2026-02-11*
