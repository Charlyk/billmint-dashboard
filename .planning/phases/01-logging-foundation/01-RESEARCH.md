# Phase 1: Logging Foundation - Research

**Researched:** 2026-02-11
**Domain:** Structured logging infrastructure with Axiom for Next.js 16 App Router
**Confidence:** MEDIUM-HIGH

## Summary

The 2026 Axiom logging ecosystem has moved away from the legacy `next-axiom` package to a modular architecture: `@axiomhq/js` (client SDK), `@axiomhq/logging` (transport layer), `@axiomhq/nextjs` (framework integration), and `@axiomhq/react` (client-side). This transport-based architecture enables multi-destination logging, explicit configuration, and framework-agnostic core design.

For Next.js 16 App Router, the standard pattern combines middleware for request logging, `createAxiomRouteHandler` wrapper for API routes, and the `after()` API for non-blocking server component logging. Request correlation requires custom AsyncLocalStorage implementation as Axiom packages don't provide built-in correlation ID propagation. PII sanitization must be implemented through custom serializers/formatters before logs reach Axiom.

Environment gating is critical: use `process.env.VERCEL_ENV === 'production'` or custom `NEXT_PUBLIC_APP_ENV` rather than `NODE_ENV` (which is always 'production' in builds). Edge Runtime compatibility is partial—AsyncLocalStorage is supported but has known issues with context propagation in non-native Promises/thenables when deployed to Vercel Edge/Cloudflare Workers.

**Primary recommendation:** Implement AsyncLocalStorage-based correlation IDs in middleware, use Axiom's transport architecture with custom PII sanitization formatters, leverage Next.js 16's `after()` API for non-blocking log flushing, and gate all Axiom calls with `VERCEL_ENV === 'production'` checks.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@axiomhq/js` | latest | Axiom client SDK | Official Axiom client, peer dependency for all packages |
| `@axiomhq/logging` | latest | Transport-based logging core | Framework-agnostic, multi-destination support |
| `@axiomhq/nextjs` | latest | Next.js integration helpers | Provides `createAxiomRouteHandler`, `transformMiddlewareRequest`, `nextJsFormatters` |
| `@axiomhq/react` | latest | Client-side logging hooks | For frontend logging (Phase 2, not Phase 1) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crypto.randomUUID()` | Node.js built-in | Correlation ID generation | Native, fastest performance (25M+ ops/sec), standard UUID v4 |
| `AsyncLocalStorage` | Node.js built-in | Request context propagation | Maintain correlation IDs across async boundaries |
| `next/server` `after()` | Next.js 16+ | Non-blocking background tasks | Flush logs after response without blocking user |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `crypto.randomUUID()` | `nanoid` | Nanoid is smaller (21 chars vs 36) but slower (5.6M ops/sec vs 25M+); prefer UUID for standard compliance |
| Custom correlation ID | OpenTelemetry SDK | Full distributed tracing stack—overkill for single-service logging foundation; defer to Phase 8+ |
| `next-axiom` (legacy) | `@axiomhq/nextjs` | Legacy package is deprecated, no new features, lacks transport architecture |
| `NODE_ENV` | `VERCEL_ENV` or `NEXT_PUBLIC_APP_ENV` | `NODE_ENV` always 'production' in builds; can't distinguish staging/prod deployments |

**Installation:**
```bash
npm install @axiomhq/js @axiomhq/logging @axiomhq/nextjs @axiomhq/react
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── logging/
│   │   ├── axiom.ts              # Axiom client singleton
│   │   ├── logger.ts             # Logger instance with transports & formatters
│   │   ├── correlation.ts        # AsyncLocalStorage for correlation IDs
│   │   └── sanitizers.ts         # PII sanitization formatters
│   └── types/
│       └── logging.ts            # Structured log schema types
├── middleware.ts                  # Request interception, correlation ID generation
└── app/
    └── api/
        └── */route.ts            # Wrapped with withAxiom
```

### Pattern 1: Middleware-Based Correlation ID Initialization
**What:** Generate unique correlation ID per request in middleware, store in AsyncLocalStorage, propagate through entire request lifecycle.

**When to use:** Every request that needs trace correlation across API routes, server components, and downstream services.

**Example:**
```typescript
// Source: https://www.dash0.com/guides/contextual-logging-in-nodejs
// lib/logging/correlation.ts
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  correlationId: string;
  logger: Logger;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

export function getLogger(): Logger {
  return requestContext.getStore()?.logger || fallbackLogger;
}

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest, NextFetchEvent } from 'next/server';
import { requestContext } from '@/lib/logging/correlation';
import { logger } from '@/lib/logging/logger';

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();
  const requestLogger = logger.child({ correlationId });

  const store: RequestContext = { correlationId, logger: requestLogger };

  return requestContext.run(store, async () => {
    requestLogger.info('Request received', {
      method: request.method,
      path: request.nextUrl.pathname,
    });

    const response = NextResponse.next();
    response.headers.set('x-correlation-id', correlationId);

    event.waitUntil(requestLogger.flush());
    return response;
  });
}
```

### Pattern 2: Route Handler Wrapper with Automatic Logging
**What:** Use `createAxiomRouteHandler` to wrap API routes, automatically logging request/response with timing.

**When to use:** All API routes in `app/api/*/route.ts`.

**Example:**
```typescript
// Source: https://axiom.co/docs/send-data/nextjs
// lib/logging/logger.ts
import { Axiom } from '@axiomhq/js';
import { Logger, AxiomJSTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, nextJsFormatters } from '@axiomhq/nextjs';

const axiomClient = new Axiom({
  token: process.env.AXIOM_TOKEN!,
});

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.AXIOM_DATASET!,
    }),
  ],
  formatters: nextJsFormatters,
});

export const withAxiom = createAxiomRouteHandler(logger);

// app/api/invoices/route.ts
import { withAxiom } from '@/lib/logging/logger';
import { getLogger } from '@/lib/logging/correlation';

export const GET = withAxiom(async (request: Request) => {
  const log = getLogger();
  log.info('Fetching invoices');

  // Business logic
  const invoices = await fetchInvoices();

  return Response.json({ invoices });
});
```

### Pattern 3: Server Component Logging with after()
**What:** Use Next.js 16 `after()` API to flush logs without blocking response.

**When to use:** Server components that need to log but can't use middleware context (AsyncLocalStorage doesn't propagate to server components from middleware).

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/after
import { after } from 'next/server';
import { logger } from '@/lib/logging/logger';

export default async function DashboardPage() {
  const startTime = Date.now();

  // Business logic
  const data = await loadDashboardData();

  after(() => {
    logger.info('Dashboard rendered', {
      loadTime: Date.now() - startTime,
      itemCount: data.items.length,
    });
    logger.flush();
  });

  return <Dashboard data={data} />;
}
```

### Pattern 4: PII Sanitization Formatter
**What:** Custom formatter that sanitizes sensitive fields before serialization to prevent PII leaks.

**When to use:** All production logging; apply to logger instance globally.

**Example:**
```typescript
// Source: https://betterstack.com/community/guides/logging/sensitive-data
// lib/logging/sanitizers.ts
const PII_FIELDS = ['email', 'password', 'token', 'sessionToken', 'apiKey', 'creditCard', 'ssn'];
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export function sanitizePII(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizePII);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_FIELDS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      sanitized[key] = value
        .replace(EMAIL_PATTERN, '***@***.***')
        .replace(CARD_PATTERN, '**** **** **** ****');
    } else {
      sanitized[key] = sanitizePII(value);
    }
  }

  return sanitized;
}

// lib/logging/logger.ts
export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.AXIOM_DATASET!,
    }),
  ],
  formatters: [
    ...nextJsFormatters,
    (log) => ({
      ...log,
      context: sanitizePII(log.context),
    }),
  ],
});
```

### Pattern 5: Environment Gating for Production-Only Logging
**What:** Conditionally initialize Axiom transports based on deployment environment.

**When to use:** Always—prevents development data from polluting production analytics.

**Example:**
```typescript
// Source: https://github.com/vercel/next.js/discussions/48914
// lib/logging/logger.ts
import { Axiom } from '@axiomhq/js';
import { Logger, ConsoleTransport, AxiomJSTransport } from '@axiomhq/logging';

const isProduction = process.env.VERCEL_ENV === 'production';

const transports = isProduction && process.env.AXIOM_TOKEN
  ? [
      new AxiomJSTransport({
        axiom: new Axiom({ token: process.env.AXIOM_TOKEN }),
        dataset: process.env.AXIOM_DATASET!,
      }),
    ]
  : [new ConsoleTransport()];

export const logger = new Logger({
  transports,
  formatters: isProduction ? [sanitizePII] : [],
});
```

### Anti-Patterns to Avoid
- **Using `NODE_ENV` for environment detection:** It's always 'production' in Next.js builds; use `VERCEL_ENV` or custom env var instead.
- **Logging Request objects directly:** Causes circular reference JSON serialization errors; extract specific properties only.
- **Blocking responses for log flushing:** Use `after()` or `waitUntil()` to flush async without blocking.
- **Middleware response interception for status codes:** Next.js middleware can't access response after `NextResponse.next()`; log status in route handlers instead.
- **AsyncLocalStorage in Edge Runtime thenables:** Context doesn't propagate through non-native Promises on Cloudflare Workers/Vercel Edge; stick to native async/await.
- **Assuming AsyncLocalStorage propagates from middleware to server components:** It doesn't; server components need separate logging initialization.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-destination logging | Custom log router with conditional logic | `@axiomhq/logging` transport architecture | Transport pattern handles fallbacks, retries, concurrent destinations; custom logic misses edge cases (network failures, rate limits) |
| Request correlation IDs | Manual header passing through function params | `AsyncLocalStorage` with context store | Parameter drilling is error-prone, breaks abstraction; AsyncLocalStorage maintains context across async boundaries automatically |
| PII detection | Regex-only field scanning | Structured sanitizer with allowlist + pattern matching | PII appears in unexpected places (stack traces, URLs, nested objects); allowlist-first approach is safer than denylist |
| JSON circular reference handling | Try/catch with fallback JSON.stringify | Structured extraction with explicit field lists | Circular refs in Request/Response objects are expected; extract known-safe fields rather than stringify entire objects |
| Log buffering/batching | Custom queue with setTimeout | Axiom SDK's built-in batching + `flush()` | Batching logic is complex (max batch size, time windows, error handling); Axiom handles this internally |
| Environment detection | `NODE_ENV` checks | `VERCEL_ENV` or `NEXT_PUBLIC_APP_ENV` | `NODE_ENV` doesn't distinguish staging/preview/production in Vercel; need deployment-specific vars |

**Key insight:** Logging infrastructure has deceptively complex edge cases—network failures during shutdown, circular references in error objects, context loss in async flows, PII in stack traces. Use battle-tested libraries rather than custom solutions for the foundation; save customization for business-specific log enrichment.

## Common Pitfalls

### Pitfall 1: AsyncLocalStorage Context Loss in Edge Runtime
**What goes wrong:** Correlation IDs disappear in production Vercel Edge deployments despite working locally in Node.js runtime.

**Why it happens:** Cloudflare Workers (underlying Vercel Edge) has incomplete AsyncLocalStorage support—context doesn't propagate through non-native Promise implementations (polyfills, libraries that use custom thenables).

**How to avoid:**
- Use Node.js runtime for routes requiring AsyncLocalStorage correlation
- For Edge routes, pass correlation ID explicitly via headers or function parameters
- Test on Vercel preview deployments, not just local dev

**Warning signs:** Logs missing `correlationId` field only in production, local dev works fine.

**Source:** https://github.com/vercel/next.js/issues/52774

### Pitfall 2: Circular Reference Serialization in Request Logging
**What goes wrong:** `JSON.stringify()` throws "Converting circular structure to JSON" when trying to log entire Request/Response objects.

**Why it happens:** Node.js `Request` objects (`http.IncomingMessage`) contain circular references by design (e.g., `request.socket.parser.incoming === request`).

**How to avoid:**
- Never log entire Request/Response objects
- Extract specific properties: `{ method: req.method, url: req.url, headers: Object.fromEntries(req.headers) }`
- Use `@axiomhq/nextjs` `transformMiddlewareRequest()` helper which extracts safe fields

**Warning signs:** Runtime error during logging: "TypeError: Converting circular structure to JSON".

**Sources:**
- https://www.geeksforgeeks.org/javascript/what-is-typeerror-converting-circular-structure-to-json/
- https://www.w3tutorials.net/blog/typeerror-converting-circular-structure-to-json-in-nodejs/

### Pitfall 3: Middleware Can't Log Response Status Codes
**What goes wrong:** Middleware logging shows request details but no response status/timing, despite attempts to intercept response.

**Why it happens:** Next.js middleware is "in-only"—when you return `NextResponse.next()`, middleware execution ends before the response comes back. No access to response object from middleware.

**How to avoid:**
- Log request details in middleware (method, path, headers, correlation ID)
- Log response details in route handlers using `withAxiom` wrapper
- For comprehensive request-response logging, patch Next.js server with tools like `pino-http` (complex, not recommended for Phase 1)

**Warning signs:** Middleware logs have `status: undefined` or missing response timing.

**Source:** https://github.com/vercel/next.js/discussions/34420

### Pitfall 4: NODE_ENV Doesn't Distinguish Vercel Environments
**What goes wrong:** Logs from Vercel preview deployments (staging, feature branches) pollute production dataset because `NODE_ENV === 'production'` for all builds.

**Why it happens:** Next.js sets `NODE_ENV=production` for all optimized builds (`next build`), regardless of deployment target. It only distinguishes `development` (local `next dev`) vs `production` (any build).

**How to avoid:**
- Use `process.env.VERCEL_ENV` which has values: `production`, `preview`, `development`
- Or set custom `NEXT_PUBLIC_APP_ENV` in Vercel environment variables per deployment
- Gate Axiom logging: `if (process.env.VERCEL_ENV === 'production') { /* init Axiom */ }`

**Warning signs:** Axiom dataset shows logs from preview URLs (e.g., `app-git-branch-team.vercel.app`) mixed with production logs.

**Source:** https://github.com/vercel/next.js/discussions/48914

### Pitfall 5: Server Component Logs Block Response When Not Using after()
**What goes wrong:** Server component rendering is slow in production; logs flush synchronously before HTML is sent.

**Why it happens:** Without `after()`, awaiting `logger.flush()` blocks the response stream. Next.js waits for all async operations to complete before sending HTML.

**How to avoid:**
- Always wrap log flushing in `after(() => logger.flush())`
- `after()` schedules work to run after response is sent to client
- For Route Handlers, use `event.waitUntil()` in middleware or `after()` in handler

**Warning signs:** Server component Time to First Byte (TTFB) includes network latency to Axiom (100-500ms).

**Source:** https://nextjs.org/docs/app/api-reference/functions/after

### Pitfall 6: PII Leaks Through Error Stack Traces
**What goes wrong:** Production logs contain user emails, tokens, or session IDs despite sanitizing request bodies—they appear in error stack traces and messages.

**Why it happens:** Error messages often include variable values (e.g., `Error: Invalid token abc123xyz`), and stack traces can expose local variable names/values in some runtime environments.

**How to avoid:**
- Sanitize error messages before logging: `error.message.replace(EMAIL_PATTERN, '***@***')`
- Sanitize stack traces: `error.stack.replace(TOKEN_PATTERN, '[TOKEN]')`
- Use structured error context fields instead of interpolating values into messages
- Apply sanitization formatter at logger level to catch all logs

**Warning signs:** Grep production logs for email patterns, find matches in `error.stack` fields.

**Source:** https://betterstack.com/community/guides/logging/sensitive-data

## Code Examples

Verified patterns from official sources:

### Minimal Axiom Logger Setup
```typescript
// Source: https://axiom.co/docs/send-data/nextjs
import { Axiom } from '@axiomhq/js';
import { Logger, AxiomJSTransport } from '@axiomhq/logging';
import { createAxiomRouteHandler, nextJsFormatters } from '@axiomhq/nextjs';

const axiomClient = new Axiom({
  token: process.env.AXIOM_TOKEN!,
});

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: process.env.AXIOM_DATASET!,
    }),
  ],
  formatters: nextJsFormatters,
});

export const withAxiom = createAxiomRouteHandler(logger);
```

### Middleware Request Logging with Correlation ID
```typescript
// Source: https://axiom.co/docs/send-data/nextjs + https://www.dash0.com/guides/contextual-logging-in-nodejs
import { logger } from '@/lib/logging/logger';
import { transformMiddlewareRequest } from '@axiomhq/nextjs';
import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  const logData = transformMiddlewareRequest(request);
  logger.info(...logData, { correlationId });

  const response = NextResponse.next();
  response.headers.set('x-correlation-id', correlationId);

  event.waitUntil(logger.flush());
  return response;
}
```

### Route Handler with Automatic Logging
```typescript
// Source: https://axiom.co/docs/send-data/nextjs
import { withAxiom } from '@/lib/logging/logger';

export const GET = withAxiom(async (request: Request) => {
  // withAxiom automatically logs request method, path, status, timing
  return Response.json({ status: 'ok' });
});

export const POST = withAxiom(async (request: Request) => {
  const body = await request.json();
  // Business logic
  return Response.json({ created: true }, { status: 201 });
});
```

### Server Component Non-Blocking Logging
```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/after
import { after } from 'next/server';
import { logger } from '@/lib/logging/logger';

export default async function ServerComponent() {
  const data = await fetchData();

  after(() => {
    logger.info('Component rendered', {
      itemCount: data.items.length,
      userId: data.userId,
    });
    logger.flush();
  });

  return <div>{/* render */}</div>;
}
```

### AsyncLocalStorage Correlation Context
```typescript
// Source: https://www.dash0.com/guides/contextual-logging-in-nodejs
import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  correlationId: string;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

// In middleware:
export function middleware(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  return requestContext.run({ correlationId }, () => {
    // All downstream code can call getCorrelationId()
    return NextResponse.next();
  });
}
```

### Environment-Gated Logger Initialization
```typescript
// Source: https://github.com/vercel/next.js/discussions/48914
import { Logger, ConsoleTransport, AxiomJSTransport } from '@axiomhq/logging';

const isProduction = process.env.VERCEL_ENV === 'production';

export const logger = new Logger({
  transports: isProduction && process.env.AXIOM_TOKEN
    ? [new AxiomJSTransport({ /* ... */ })]
    : [new ConsoleTransport()],
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-axiom` package | `@axiomhq/nextjs` + modular architecture | May 2025 | Legacy package deprecated; new architecture separates concerns (client SDK, transports, framework integration) |
| Synchronous log flushing | `after()` API for non-blocking flush | Next.js 15.1.0 (stable in 16.x) | Eliminates log-induced latency in server components and route handlers |
| `NODE_ENV` for environment detection | `VERCEL_ENV` or custom env vars | Ongoing (Next.js 9+) | `NODE_ENV` can't distinguish staging/preview/production deployments |
| Manual AsyncLocalStorage setup | Native Node.js `async_hooks` module | Node.js 13.10.0 (2020), stable 14+ | Removed need for userland context libraries (cls-hooked, continuation-local-storage) |
| OpenTelemetry for simple logging | Lightweight Axiom SDK | 2025-2026 shift | OTel is overkill for single-service logging; defer distributed tracing to Phase 8+ |

**Deprecated/outdated:**
- **`next-axiom`:** Replaced by `@axiomhq/nextjs`; no new features, bug fixes only. Migration guide: https://axiom.co/blog/new-js-logging
- **`winston`/`pino` Axiom transports:** Use `@axiomhq/logging` transport architecture instead; old transports don't integrate with Next.js-specific APIs (middleware, `after()`).
- **`cls-hooked`/`continuation-local-storage`:** Use native `AsyncLocalStorage` from `node:async_hooks`; old libraries had memory leaks and didn't work with async/await.

## Open Questions

### 1. AsyncLocalStorage Propagation to Server Components from Middleware
- **What we know:** AsyncLocalStorage context set in middleware doesn't propagate to server components in some Next.js versions (issue #67305, #69298).
- **What's unclear:** Is this fixed in Next.js 16.1.4 (current project version)? Does it work in Node.js runtime but not Edge?
- **Recommendation:** Assume context doesn't propagate; implement correlation ID via explicit logger initialization in route handlers and pass through React context if needed in components. Test in Vercel preview before relying on middleware → component propagation.

### 2. Edge Runtime Support for @axiomhq/nextjs
- **What we know:** `@axiomhq/nextjs` documentation doesn't explicitly address Edge Runtime compatibility. AsyncLocalStorage has known issues in Vercel Edge/Cloudflare Workers.
- **What's unclear:** Can `@axiomhq/nextjs` transports run in Edge Runtime? Does `withAxiom` wrapper work for Edge API routes?
- **Recommendation:** Default to Node.js runtime for logging-critical routes in Phase 1. Test Edge compatibility in Phase 2 webhook handlers if needed; may require explicit `export const runtime = 'nodejs'` in route.ts files.

### 3. Optimal Log Flush Strategy for High-Throughput Routes
- **What we know:** `logger.flush()` is async and can be deferred with `after()` or `waitUntil()`. Axiom SDK has internal batching.
- **What's unclear:** What's the maximum batch size and time window before auto-flush? Do we need explicit flush calls in route handlers or does `withAxiom` handle it?
- **Recommendation:** Use `withAxiom` for automatic handling in route handlers. Add explicit `after(() => logger.flush())` in server components and middleware. Monitor Axiom ingestion lag in Phase 2 to validate strategy.

### 4. PII Sanitization Performance Impact
- **What we know:** Regex-based sanitization runs on every log call. Pattern matching (email, credit card) is computationally expensive.
- **What's unclear:** Does sanitization add measurable latency to request handling? Should we defer sanitization to Axiom ingestion pipeline instead of client-side?
- **Recommendation:** Implement client-side sanitization in Phase 1 (defense in depth—prevents PII from ever leaving server). Benchmark in Phase 2; if >50ms overhead, move to allowlist-only (no regex) or server-side sanitization in Axiom.

## Sources

### Primary (HIGH confidence)
- **Axiom Official Docs:** https://axiom.co/docs/send-data/nextjs - Setup instructions, API reference, examples for @axiomhq/nextjs
- **Axiom Blog (New JS Logging):** https://axiom.co/blog/new-js-logging - Architecture rationale for modular packages (May 2025)
- **Next.js after() API Reference:** https://nextjs.org/docs/app/api-reference/functions/after - Official documentation for non-blocking background tasks (updated 2026-01-26)
- **Dash0 AsyncLocalStorage Guide:** https://www.dash0.com/guides/contextual-logging-in-nodejs - Complete pattern for correlation IDs with code examples
- **Better Stack Sensitive Data Guide:** https://betterstack.com/community/guides/logging/sensitive-data - PII sanitization techniques with code examples

### Secondary (MEDIUM confidence)
- **Vercel Edge Runtime Limitations:** https://github.com/vercel/next.js/issues/52774 - AsyncLocalStorage thenable context loss in Cloudflare Workers
- **NODE_ENV Discussion:** https://github.com/vercel/next.js/discussions/48914 - Clarifies NODE_ENV behavior in Next.js builds
- **Middleware Logging Limitations:** https://github.com/vercel/next.js/discussions/34420 - Explains middleware can't access response
- **Next.js AsyncLocalStorage Issues:** https://github.com/vercel/next.js/discussions/67305 - Context propagation challenges between middleware and server components
- **UUID vs NanoID Benchmarks:** https://prabeshthapa.medium.com/optimizing-your-system-with-the-right-unique-id-uuid-ulid-or-nanoid-78bf8b7bf200 - Performance comparison for correlation ID generation
- **Circular Reference Error Explanation:** https://www.geeksforgeeks.org/javascript/what-is-typeerror-converting-circular-structure-to-json/ - Covers Node.js Request object circular references
- **OpenTelemetry Structured Logging:** https://opentelemetry.io/docs/specs/otel/logs/data-model/ - Industry-standard log schema design

### Tertiary (LOW confidence)
- **WebSearch findings on AsyncLocalStorage patterns:** Multiple sources agree on basic pattern but lack Next.js 16-specific validation
- **PII detection strategies:** General best practices but not specific to Axiom/Next.js integration

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH - Official Axiom docs and npm packages clearly define current architecture
- **Architecture patterns:** MEDIUM-HIGH - Patterns verified from official sources (Axiom, Next.js docs) but some integration points untested in Next.js 16.1.4 specifically
- **Pitfalls:** MEDIUM - Issues documented in GitHub discussions and blog posts, but resolution status unclear for latest Next.js version
- **AsyncLocalStorage propagation:** LOW - Conflicting reports about middleware → server component context propagation; needs hands-on testing
- **Edge Runtime compatibility:** LOW - No official confirmation of @axiomhq/nextjs Edge Runtime support; AsyncLocalStorage known issues in Edge documented

**Research date:** 2026-02-11
**Valid until:** 2026-03-15 (30 days—Axiom ecosystem is stable, Next.js 16.x patch releases unlikely to change logging APIs)
