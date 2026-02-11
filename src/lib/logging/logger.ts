/**
 * Main logger instance with environment-conditional transports and PII sanitization.
 * Exports logger, service logger factory, and route handler wrapper.
 */

import {
  Logger,
  AxiomJSTransport,
  ConsoleTransport,
  type Transport,
  type Formatter,
} from '@axiomhq/logging';
import { nextJsFormatters, createAxiomRouteHandler } from '@axiomhq/nextjs';
import { axiomClient, isProduction, AXIOM_DATASET } from './axiom';
import { sanitizeContext } from './sanitizers';
import type { ServiceName, LogLevel } from '@/types/logging';

/**
 * Build transports based on environment.
 * Production with Axiom token: send to Axiom
 * Development or missing token: log to console
 */
const transports: [Transport, ...Transport[]] =
  isProduction && axiomClient
    ? [
        new AxiomJSTransport({
          axiom: axiomClient,
          dataset: AXIOM_DATASET,
        }),
      ]
    : [new ConsoleTransport()];

/**
 * Build formatters with Next.js support and PII sanitization.
 * Only apply PII sanitization in production to avoid dev performance cost.
 */
const formatters: Formatter[] = [...nextJsFormatters];

// Add PII sanitization formatter in production
if (isProduction) {
  const piiSanitizationFormatter: Formatter = (log) => ({
    ...log,
    context: log.context ? sanitizeContext(log.context) : undefined,
  });

  formatters.push(piiSanitizationFormatter);
}

/**
 * Core logger instance.
 * Use this directly for generic logging, or use createServiceLogger for service-specific logs.
 */
export const logger = new Logger({
  transports,
  formatters,
});

/**
 * Service-specific logger interface.
 * Automatically includes service name in every log call.
 */
interface ServiceLogger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

/**
 * Create a service-specific logger.
 * Automatically includes the service name in the context of every log.
 *
 * @param service - Service name (e.g., 'invoice', 'auth', 'billing')
 * @returns ServiceLogger instance with debug/info/warn/error methods
 *
 * @example
 * const log = createServiceLogger('invoice');
 * log.info('Created invoice', { invoiceId: '123' });
 * // Logs: { level: 'info', message: 'Created invoice', service: 'invoice', context: { invoiceId: '123' } }
 */
export function createServiceLogger(service: ServiceName): ServiceLogger {
  return {
    debug: (message: string, context?: Record<string, unknown>) => {
      logger.debug(message, { service, ...context });
    },
    info: (message: string, context?: Record<string, unknown>) => {
      logger.info(message, { service, ...context });
    },
    warn: (message: string, context?: Record<string, unknown>) => {
      logger.warn(message, { service, ...context });
    },
    error: (message: string, context?: Record<string, unknown>) => {
      logger.error(message, { service, ...context });
    },
  };
}

/**
 * Axiom route handler wrapper.
 * Use this to wrap Next.js API routes for automatic request/response logging.
 *
 * @example
 * export const GET = withAxiom(async (req) => {
 *   // Your route handler logic
 * });
 */
export const withAxiom = createAxiomRouteHandler(logger);
