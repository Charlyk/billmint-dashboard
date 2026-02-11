/**
 * Route handler wrapper for automatic request/response logging.
 * Logs method, path, status code, response time, and errors with correlation IDs.
 */

import { type NextRequest } from 'next/server';
import { getCorrelationId, generateCorrelationId } from './correlation';
import { logger } from './logger';
import { sanitizeError } from './sanitizers';

/**
 * Route handler function signature.
 * Supports both simple handlers and dynamic route handlers with params.
 */
export type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

/**
 * Wrap a route handler with automatic logging.
 * Logs request details on entry and response details on exit.
 * Captures errors with full context and re-throws for existing error handling.
 *
 * @param handler - The route handler function to wrap
 * @returns Wrapped handler with automatic logging
 *
 * @example
 * async function handleGet(request: NextRequest) {
 *   // Your implementation
 *   return Response.json({ data: results })
 * }
 *
 * export const GET = withLogging(handleGet)
 */
export function withLogging(handler: RouteHandler): RouteHandler {
  return async (request, context) => {
    const startTime = Date.now();

    // Get correlation ID from AsyncLocalStorage or fallback to header or generate new
    const correlationId =
      getCorrelationId() ||
      request.headers.get('x-correlation-id') ||
      generateCorrelationId();

    const method = request.method;
    const path = new URL(request.url).pathname;

    try {
      // Execute the wrapped handler
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // Log successful response
      logger.info('API response', {
        service: 'api',
        correlationId,
        method,
        path,
        statusCode: response.status,
        duration,
      });

      return response;
    } catch (error) {
      // Log error with full context
      const duration = Date.now() - startTime;

      logger.error('API error', {
        service: 'api',
        correlationId,
        method,
        path,
        duration,
        error: sanitizeError(error),
      });

      // Re-throw to allow existing error handling (handleError) to work
      throw error;
    }
  };
}
