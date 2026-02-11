/**
 * Correlation ID system using AsyncLocalStorage.
 * Provides request context propagation throughout the async call chain.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Request context containing the correlation ID.
 * This is stored in AsyncLocalStorage and accessible throughout the request lifecycle.
 */
export interface RequestContext {
  correlationId: string;
}

/**
 * AsyncLocalStorage instance for request context.
 * This allows correlation IDs to be accessible in downstream code without explicit passing.
 */
export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current correlation ID from AsyncLocalStorage.
 * Returns undefined if called outside of a request context.
 *
 * @returns The correlation ID for the current request, or undefined if not in a request context
 *
 * @example
 * const correlationId = getCorrelationId();
 * if (correlationId) {
 *   logger.info('Processing request', { correlationId });
 * }
 */
export function getCorrelationId(): string | undefined {
  return requestContext.getStore()?.correlationId;
}

/**
 * Generate a new correlation ID using UUID v4.
 * Uses the global crypto API (available in Node.js 19+).
 *
 * @returns A new UUID v4 correlation ID
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}
