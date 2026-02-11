/**
 * Structured logging types for Axiom integration.
 * Defines log levels, service names, and the schema for structured logs.
 */

/**
 * Log severity levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Service names across the application.
 * Covers all 14 services in the system.
 */
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

/**
 * Error context serialized for logging.
 * Captures error details in a structured format.
 */
export interface ErrorContext {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Structured log entry schema.
 * All logs sent to Axiom follow this structure.
 */
export interface StructuredLog {
  level: LogLevel;
  message: string;
  service: ServiceName;
  timestamp: string; // ISO 8601 format
  correlationId?: string;
  context?: Record<string, unknown>;
  error?: ErrorContext;
}

/**
 * Options for creating a logger instance
 */
export interface LoggerOptions {
  service: ServiceName;
  defaultContext?: Record<string, unknown>;
}
