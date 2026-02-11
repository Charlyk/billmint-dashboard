# Phase 2: Service Migration - Research

**Researched:** 2026-02-11
**Domain:** Codebase migration - replacing console.error/console.log with structured Axiom logging
**Confidence:** HIGH

## Summary

Phase 2 is a systematic codebase migration task, not a new technology integration. The logging infrastructure from Phase 1 is already built and ready to use. The primary work is replacing 72 console.error/console.log calls across 14 service files with the structured Axiom logger.

This research provides exact counts of console calls per file, documents the webhook async logging pattern required to prevent Stripe timeouts, and identifies the cron job execution logging pattern needed for Vercel scheduled tasks. The migration is straightforward with clear patterns, but requires attention to two critical execution contexts: webhooks (must respond within 10 seconds) and cron jobs (must log execution lifecycle).

**Primary recommendation:** Migrate files systematically by service domain (auth, billing, cron, etc.), use async fire-and-forget logging for webhooks, and ensure cron job routes log execution start, duration, success/failure, and items processed.

## Console Call Inventory

**Total console calls to migrate:** 72 across 14 service files

### Breakdown by File

| File | console.error | console.log | Total | Primary Pattern |
|------|--------------|-------------|-------|-----------------|
| email.service.ts | 11 | 0 | 11 | Error handling in email send functions |
| invoice.service.ts | 14 | 2 | 16 | RPC errors, email operations, status updates |
| user.service.ts | 11 | 0 | 11 | RPC errors, auth operations, OTP handling |
| auth.service.ts | 7 | 0 | 7 | Email send failures, verification errors |
| timer.service.ts | 6 | 0 | 6 | RPC errors on timer operations |
| logo.service.ts | 4 | 0 | 4 | Upload errors, storage operations |
| project.service.ts | 4 | 0 | 4 | RPC errors on CRUD operations |
| billing.service.ts | 2 | 1 | 3 | Stripe API errors, payment events |
| client.service.ts | 3 | 0 | 3 | RPC errors on client operations |
| time-entry.service.ts | 3 | 0 | 3 | RPC errors on time entry operations |
| cron.service.ts | 2 | 0 | 2 | RPC errors, email send failures |
| dashboard.service.ts | 1 | 0 | 1 | RPC errors |
| report.service.ts | 1 | 0 | 1 | RPC errors |
| pdf.service.ts | 0 | 0 | 0 | No console calls |

### Breakdown by Pattern Type

| Pattern | Count | Example |
|---------|-------|---------|
| RPC error handling | 38 | `console.error('[Service] RPC error:', error)` |
| Email send failures | 13 | `console.error('Failed to send X email:', error)` |
| Stripe API errors | 3 | `console.error('Failed to retrieve Stripe subscription:', error)` |
| Storage operations | 4 | `console.error('[Logo] Upload error:', uploadError)` |
| Payment events | 1 | `console.log(\`Payment failed for customer \${customerId}\`)` |
| Informational logs | 2 | `console.log('[Invoice] Sending reminder email')` |
| Cron results | 1 | `console.log('[Cron] Auto-pause timers result:', result)` |

### API Route Console Calls

In addition to service files, there are console calls in API routes:

| File | Calls | Context |
|------|-------|---------|
| src/app/api/cron/auto-pause-timers/route.ts | 2 | Cron job execution logging |
| src/app/api/invoices/route.ts | 1 | Query validation warning |
| src/app/api/billing/webhook/route.ts | 0 | Uses handleError utility |

**Note:** Cron route console calls should remain or be migrated carefully as they represent execution lifecycle logging (start, result, errors).

## Standard Stack

### Already Built (Phase 1)

| Component | Location | Purpose |
|-----------|----------|---------|
| Logger | src/lib/logging/logger.ts | Core logger with transports, formatters, PII sanitization |
| createServiceLogger | src/lib/logging/logger.ts | Factory for service-scoped loggers |
| withLogging | src/lib/logging/route-handler.ts | Route handler wrapper for automatic request/response logging |
| sanitizeError | src/lib/logging/sanitizers.ts | Redact PII from error objects |
| sanitizeContext | src/lib/logging/sanitizers.ts | Redact PII from context objects |
| getCorrelationId | src/lib/logging/correlation.ts | Get correlation ID from AsyncLocalStorage |

### No New Dependencies Required

All logging infrastructure is already in place. This phase only requires importing and using existing utilities.

## Architecture Patterns

### Pattern 1: Service Logger Initialization

**What:** Create a service-scoped logger at the top of each service file
**When to use:** For all 14 service files
**Example:**

```typescript
// Source: Phase 1 implementation - src/lib/logging/logger.ts
import { createServiceLogger } from '@/lib/logging/logger';

const log = createServiceLogger('invoice'); // ServiceName from types/logging.ts

// Later in code:
log.error('Failed to create invoice', {
  invoiceId,
  error: sanitizeError(error)
});
```

### Pattern 2: Replace console.error with Structured Logging

**What:** Replace console.error calls with log.error, adding context
**When to use:** For all 61 console.error calls
**Example:**

```typescript
// BEFORE (codebase as-is):
console.error('[Invoice] create_invoice RPC error:', error)

// AFTER (migration target):
log.error('Failed to create invoice', {
  operation: 'create_invoice',
  error: sanitizeError(error)
})
```

### Pattern 3: Replace console.log with Appropriate Level

**What:** Replace console.log with info/warn/error based on severity
**When to use:** For all 11 console.log calls
**Example:**

```typescript
// BEFORE:
console.log(`Payment failed for customer ${customerId}`)

// AFTER:
log.warn('Payment failed', {
  customerId,
  event: 'invoice.payment_failed'
})

// BEFORE:
console.log('[Invoice] Sending reminder email')

// AFTER:
log.info('Sending reminder email', {
  invoiceNumber: emailData.invoice.invoice_number
})
```

### Pattern 4: Async Webhook Logging (Critical for Stripe)

**What:** Log webhook events asynchronously to prevent timeout
**When to use:** In billing.service.ts handleWebhook function
**Why:** Stripe timeouts webhooks after 10 seconds if no 2xx response

**Current code (billing.service.ts:171-243):**
```typescript
export async function handleWebhook(
  body: string,
  signature: string
): Promise<void> {
  // ... signature validation ...

  switch (event.type) {
    case 'checkout.session.completed': {
      // Process synchronously
      await supabase.rpc('handle_stripe_webhook', {...})
      break
    }
    // ... more cases ...
  }
}
```

**Migration pattern:**
```typescript
// Source: Stripe webhook best practices
// https://docs.stripe.com/webhooks

const log = createServiceLogger('billing');

export async function handleWebhook(
  body: string,
  signature: string
): Promise<void> {
  const startTime = Date.now();

  // Get correlation ID from context or generate
  const correlationId = getCorrelationId() || crypto.randomUUID();

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    log.error('Webhook signature validation failed', {
      correlationId,
      error: sanitizeError(error)
    });
    throw new ValidationError('Invalid webhook signature');
  }

  // Log webhook received - BEFORE processing
  log.info('Webhook received', {
    correlationId,
    eventId: event.id,
    eventType: event.type
  });

  // Process webhook (existing logic continues...)
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        await supabase.rpc('handle_stripe_webhook', {...});

        // Log successful processing
        log.info('Webhook processed', {
          correlationId,
          eventId: event.id,
          eventType: event.type,
          duration: Date.now() - startTime,
          userId: session.metadata?.user_id
        });
      } catch (error) {
        log.error('Webhook processing failed', {
          correlationId,
          eventId: event.id,
          eventType: event.type,
          duration: Date.now() - startTime,
          error: sanitizeError(error)
        });
        throw error; // Re-throw to trigger Stripe retry
      }
      break;
    }
    // ... similar pattern for other cases ...
  }
}
```

**Key principles:**
- Log webhook received IMMEDIATELY after signature validation
- Log processing result AFTER completion
- Include correlationId, eventId, eventType, duration in all logs
- Logging is synchronous but fast (Axiom transport handles async flush)
- Re-throw errors to trigger Stripe retry mechanism

### Pattern 5: Cron Job Execution Logging

**What:** Log cron job lifecycle: start, duration, success/failure, items processed
**When to use:** In cron.service.ts and cron route handlers
**Example:**

```typescript
// Source: Codebase - src/lib/services/cron.service.ts
const log = createServiceLogger('cron');

export async function autopauseStaleTimers(): Promise<AutoPauseResult> {
  const startTime = Date.now();
  const correlationId = crypto.randomUUID();

  log.info('Starting timer auto-pause job', { correlationId });

  const result: AutoPauseResult = {
    processed: 0,
    paused: 0,
    errors: [],
  };

  const supabase = getSupabase();

  const { data: pausedTimers, error: rpcError } = await supabase
    .rpc('autopause_stale_timers');

  if (rpcError) {
    log.error('Auto-pause RPC failed', {
      correlationId,
      duration: Date.now() - startTime,
      error: sanitizeError(rpcError)
    });

    result.errors.push(`Failed to execute autopause function: ${rpcError.message}`);
    return result;
  }

  if (!pausedTimers || pausedTimers.length === 0) {
    log.info('Auto-pause completed - no timers to pause', {
      correlationId,
      duration: Date.now() - startTime
    });
    return result;
  }

  result.paused = pausedTimers.length;
  result.processed = pausedTimers.length;

  // Send emails (existing logic)
  for (const timer of pausedTimers) {
    try {
      await sendTimerAutoPausedEmail({...});
    } catch (emailError) {
      log.error('Failed to send auto-pause email', {
        correlationId,
        timerId: timer.timer_id,
        error: sanitizeError(emailError)
      });

      const errorMessage = emailError instanceof Error
        ? emailError.message
        : String(emailError);
      result.errors.push(`Failed to send email for timer ${timer.timer_id}: ${errorMessage}`);
    }
  }

  log.info('Auto-pause job completed', {
    correlationId,
    duration: Date.now() - startTime,
    processed: result.processed,
    paused: result.paused,
    errors: result.errors.length
  });

  return result;
}
```

**Route handler pattern:**
```typescript
// Source: src/app/api/cron/auto-pause-timers/route.ts
const log = createServiceLogger('cron');

export async function GET(request: NextRequest) {
  const correlationId = crypto.randomUUID();
  const startTime = Date.now();

  // Verify auth (existing logic)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    log.warn('Unauthorized cron request', { correlationId });
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await autopauseStaleTimers();

    log.info('Cron job succeeded', {
      correlationId,
      job: 'auto-pause-timers',
      duration: Date.now() - startTime,
      result
    });

    return Response.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Cron job failed', {
      correlationId,
      job: 'auto-pause-timers',
      duration: Date.now() - startTime,
      error: sanitizeError(error)
    });

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
```

### Anti-Patterns to Avoid

- **Mixing console and logger:** Don't leave console.error calls alongside new logger calls. Complete migration per file.
- **Blocking webhook responses:** Don't add synchronous logging that delays webhook response. Axiom transport is already async.
- **Losing error context:** Don't just log error.message. Use sanitizeError() to capture name, stack, code, statusCode.
- **Missing correlation IDs:** Always include correlationId for webhooks and cron jobs to trace execution flow.
- **Vague messages:** Replace `[Service] RPC error` with specific operation names like `Failed to create invoice`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error serialization | Custom error formatter | sanitizeError() from Phase 1 | Handles Error instances, strings, unknown types, extracts code/statusCode |
| PII redaction | Manual field filtering | sanitizeContext() from Phase 1 | Recursive sanitization, handles arrays/objects, redacts 12+ PII field types |
| Correlation IDs | Manual UUID generation per route | getCorrelationId() from Phase 1 | Uses AsyncLocalStorage for context propagation |
| Service-scoped context | Manual service field addition | createServiceLogger() from Phase 1 | Automatically includes service name in all logs |

**Key insight:** All logging infrastructure is already battle-tested in Phase 1. Don't recreate utilities or patterns - just import and use.

## Common Pitfalls

### Pitfall 1: Forgetting to Import Utilities

**What goes wrong:** Import logger but forget sanitizeError, leading to Error objects logged as `[object Object]`
**Why it happens:** Error objects don't serialize to JSON without explicit handling
**How to avoid:**
- Always import sanitizeError when logging errors
- Use destructuring: `import { createServiceLogger, sanitizeError } from '@/lib/logging'`

**Warning signs:**
- Axiom shows `error: {}` or `error: "[object Object]"`
- No stack trace in logs despite errors occurring

**Example:**
```typescript
// WRONG:
log.error('Operation failed', { error })

// CORRECT:
import { createServiceLogger } from '@/lib/logging/logger';
import { sanitizeError } from '@/lib/logging/sanitizers';

log.error('Operation failed', { error: sanitizeError(error) })
```

### Pitfall 2: Webhook Timeout from Slow Logging

**What goes wrong:** Webhook responses take >3 seconds, Stripe marks as timeout and retries
**Why it happens:** Blocking operations before returning 2xx response
**How to avoid:**
- Axiom transport is already async - no additional work needed
- Don't add manual flush operations or await logger calls
- Log DURING processing, not BEFORE returning response

**Warning signs:**
- Stripe dashboard shows "Timed out" webhook status
- Duplicate webhook events processed
- Response times >3 seconds in logs

**Example:**
```typescript
// The billing.service.ts handleWebhook function is called from:
// src/app/api/billing/webhook/route.ts

// ROUTE (no changes needed):
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    await handleWebhook(body, signature); // Logs happen here
    return Response.json({ received: true }); // Fast response
  } catch (error) {
    return handleError(error);
  }
}

// SERVICE (add logging during processing):
export async function handleWebhook(body: string, signature: string): Promise<void> {
  // Validation
  const event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);

  // Log received (fast, async flush)
  log.info('Webhook received', { eventId: event.id, eventType: event.type });

  // Process (existing logic)
  switch (event.type) { ... }

  // Log processed (fast, async flush)
  log.info('Webhook processed', { eventId: event.id, duration });
}
```

### Pitfall 3: Missing ServiceName Type

**What goes wrong:** createServiceLogger('new-service') compiles but TypeScript doesn't catch typos
**Why it happens:** ServiceName type in types/logging.ts doesn't include the service name
**How to avoid:**
- Check ServiceName type before adding logger
- All 14 services are already in the type
- Use autocomplete to verify service name

**Warning signs:**
- No TypeScript error but service field missing in Axiom
- Typos in service names (e.g., 'invioce' instead of 'invoice')

**Example:**
```typescript
// Source: src/types/logging.ts lines 15-31
export type ServiceName =
  | 'auth'
  | 'billing'
  | 'client'
  | 'cron'
  | 'dashboard'
  | 'email'
  | 'invoice'
  | 'logo'
  | 'pdf'
  | 'project'
  | 'report'
  | 'time-entry'
  | 'timer'
  | 'user'
  | 'middleware'
  | 'api';

// CORRECT - all 14 services are defined
const log = createServiceLogger('invoice'); // TypeScript validates this
```

### Pitfall 4: Losing Existing Log Context

**What goes wrong:** Current console.error calls include useful context like `[Service]` prefix or operation names, migration loses this
**Why it happens:** Direct replacement without extracting implicit context
**How to avoid:**
- Extract service name from log message (e.g., `[Invoice]` becomes service: 'invoice')
- Extract operation from message (e.g., `create_invoice RPC error` becomes operation: 'create_invoice')
- Move inline data to structured context

**Warning signs:**
- Logs are less useful after migration
- Missing information that was in console messages

**Example:**
```typescript
// BEFORE:
console.error('[Invoice] create_invoice RPC error:', error)

// WRONG (loses operation context):
log.error('RPC error', { error: sanitizeError(error) })

// CORRECT (preserves operation):
log.error('Failed to create invoice', {
  operation: 'create_invoice',
  error: sanitizeError(error)
})
```

### Pitfall 5: Not Testing in Production Environment

**What goes wrong:** Logs work in development (console transport) but fail in production (Axiom transport)
**Why it happens:** Missing AXIOM_API_TOKEN or AXIOM_DATASET in production environment
**How to avoid:**
- Phase 1 already validates env vars exist
- Logger gracefully falls back to console if Axiom unavailable
- Test in Vercel preview environment before production

**Warning signs:**
- No logs appearing in Axiom after deployment
- isProduction check failing despite being on Vercel

**Validation:**
```typescript
// Source: src/lib/logging/axiom.ts (Phase 1)
export const isProduction = process.env.NODE_ENV === 'production';

const transports: [Transport, ...Transport[]] =
  isProduction && axiomClient
    ? [new AxiomJSTransport({ axiom: axiomClient, dataset: AXIOM_DATASET })]
    : [new ConsoleTransport()];
```

## Code Examples

Verified patterns from codebase analysis:

### Example 1: Email Service Error Handling

```typescript
// Source: src/lib/services/email.service.ts line 217
// BEFORE:
try {
  await resend.emails.send({ ... })
} catch (error) {
  console.error('Failed to send welcome email:', error)
  throw error
}

// AFTER:
import { createServiceLogger } from '@/lib/logging/logger';
import { sanitizeError } from '@/lib/logging/sanitizers';

const log = createServiceLogger('email');

try {
  await resend.emails.send({ ... })
} catch (error) {
  log.error('Failed to send welcome email', {
    to: data.to,
    userId: data.userId,
    error: sanitizeError(error)
  })
  throw error
}
```

### Example 2: RPC Error Pattern (Most Common - 38 instances)

```typescript
// Source: src/lib/services/invoice.service.ts line 104
// BEFORE:
const { data, error } = await supabase.rpc('create_invoice', { ... })

if (error) {
  console.error('[Invoice] create_invoice RPC error:', error)
  throw error
}

// AFTER:
import { createServiceLogger } from '@/lib/logging/logger';
import { sanitizeError } from '@/lib/logging/sanitizers';

const log = createServiceLogger('invoice');

const { data, error } = await supabase.rpc('create_invoice', {
  p_invoice_data: invoiceData
})

if (error) {
  log.error('Failed to create invoice', {
    operation: 'create_invoice',
    error: sanitizeError(error)
  })
  throw error
}
```

### Example 3: Informational Logging (console.log → log.info)

```typescript
// Source: src/lib/services/invoice.service.ts line 359
// BEFORE:
console.log('[Invoice] Sending reminder email for invoice:', emailData.invoice.invoice_number)

try {
  await sendInvoiceReminderEmail(emailData)
  console.log('[Invoice] Reminder email sent')
} catch (emailError) {
  console.error('Failed to send reminder email:', emailError)
  throw emailError
}

// AFTER:
import { createServiceLogger } from '@/lib/logging/logger';
import { sanitizeError } from '@/lib/logging/sanitizers';

const log = createServiceLogger('invoice');

log.info('Sending reminder email', {
  invoiceNumber: emailData.invoice.invoice_number,
  recipientEmail: emailData.to
})

try {
  await sendInvoiceReminderEmail(emailData)

  log.info('Reminder email sent', {
    invoiceNumber: emailData.invoice.invoice_number
  })
} catch (emailError) {
  log.error('Failed to send reminder email', {
    invoiceNumber: emailData.invoice.invoice_number,
    error: sanitizeError(emailError)
  })
  throw emailError
}
```

### Example 4: Billing Webhook Lifecycle

```typescript
// Source: src/lib/services/billing.service.ts line 171
import { createServiceLogger } from '@/lib/logging/logger';
import { sanitizeError } from '@/lib/logging/sanitizers';
import { getCorrelationId } from '@/lib/logging/correlation';

const log = createServiceLogger('billing');

export async function handleWebhook(
  body: string,
  signature: string
): Promise<void> {
  const startTime = Date.now();
  const correlationId = getCorrelationId() || crypto.randomUUID();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new ValidationError('Stripe webhook secret is not configured');
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    log.error('Webhook signature validation failed', {
      correlationId,
      error: sanitizeError(error)
    });
    throw new ValidationError('Invalid webhook signature');
  }

  log.info('Webhook received', {
    correlationId,
    eventId: event.id,
    eventType: event.type
  });

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier as 'pro' | 'business';

        if (userId && tier && session.subscription) {
          await (supabase.rpc as any)('handle_stripe_webhook', {
            p_event_type: 'checkout.session.completed',
            p_user_id: userId,
            p_tier: tier,
            p_stripe_subscription_id: session.subscription as string,
          });

          log.info('Webhook processed', {
            correlationId,
            eventId: event.id,
            eventType: event.type,
            userId,
            tier,
            duration: Date.now() - startTime
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          await (supabase.rpc as any)('handle_stripe_webhook', {
            p_event_type: 'customer.subscription.updated',
            p_stripe_customer_id: customerId,
          });

          log.info('Webhook processed', {
            correlationId,
            eventId: event.id,
            eventType: event.type,
            customerId,
            subscriptionStatus: subscription.status,
            duration: Date.now() - startTime
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await (supabase.rpc as any)('handle_stripe_webhook', {
          p_event_type: 'customer.subscription.deleted',
          p_stripe_customer_id: customerId,
        });

        log.info('Webhook processed', {
          correlationId,
          eventId: event.id,
          eventType: event.type,
          customerId,
          duration: Date.now() - startTime
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        log.warn('Payment failed', {
          correlationId,
          eventId: event.id,
          eventType: event.type,
          customerId,
          invoiceId: invoice.id
        });
        break;
      }
    }
  } catch (processingError) {
    log.error('Webhook processing failed', {
      correlationId,
      eventId: event.id,
      eventType: event.type,
      duration: Date.now() - startTime,
      error: sanitizeError(processingError)
    });
    throw processingError;
  }
}
```

## State of the Art

This is a migration task, not a technology integration, so there is no "state of the art" to track. The patterns are determined by the existing codebase structure and Phase 1 logging infrastructure.

## Open Questions

1. **Weekly summary email cron job**
   - What we know: sendWeeklySummaryEmail exists in email.service.ts (line 222)
   - What's unclear: No cron route handler found for weekly summaries
   - Recommendation: If weekly summary cron exists, apply same logging pattern as auto-pause-timers route

2. **API route console.warn in invoices/route.ts**
   - What we know: One console.warn for query validation failure (line 31)
   - What's unclear: Should API routes use route handler wrapper or service logger?
   - Recommendation: Use service logger since it's validation logic, not request/response logging

## Sources

### Primary (HIGH confidence)

- Codebase inventory via Grep and Read tools (2026-02-11)
  - src/lib/services/*.ts - All 14 service files analyzed
  - src/lib/logging/*.ts - Phase 1 logging infrastructure reviewed
  - src/app/api/cron/auto-pause-timers/route.ts - Cron pattern analyzed
  - src/app/api/billing/webhook/route.ts - Webhook pattern analyzed

### Secondary (MEDIUM confidence)

- [Stripe Webhooks Documentation](https://docs.stripe.com/webhooks) - Webhook timeout prevention (10 second limit)
- [Hookdeck: Guide to Stripe Webhooks](https://hookdeck.com/webhooks/platforms/guide-to-stripe-webhooks-features-and-best-practices) - Async processing best practices
- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs) - Cron job logging and troubleshooting

## Metadata

**Confidence breakdown:**
- Console call inventory: HIGH - Direct codebase analysis, exact counts verified
- Migration patterns: HIGH - Based on existing Phase 1 infrastructure and codebase patterns
- Webhook async logging: MEDIUM - Based on Stripe documentation and best practices
- Cron job logging: HIGH - Based on existing cron.service.ts implementation

**Research date:** 2026-02-11
**Valid until:** 2026-03-13 (30 days - stable migration task, not dependent on external changes)
