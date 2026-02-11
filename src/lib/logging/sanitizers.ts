/**
 * PII sanitization functions for log context and error objects.
 * Redacts sensitive fields and masks patterns in strings.
 */

import type { ErrorContext } from '@/types/logging';

/**
 * PII fields to redact (case-insensitive matching)
 */
const PII_FIELDS = [
  'email',
  'password',
  'token',
  'sessiontoken',
  'apikey',
  'creditcard',
  'ssn',
  'secret',
  'authorization',
  'cookie',
  'refreshtoken',
  'accesstoken',
] as const;

/**
 * Regex patterns for detecting PII in strings
 */
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const CARD_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const TOKEN_PATTERN = /\b[A-Za-z0-9_-]{20,}\b/g;

/**
 * Maximum recursion depth to prevent infinite loops on circular references
 */
const MAX_DEPTH = 5;

/**
 * Sanitize a string by replacing PII patterns
 */
function sanitizeString(str: string): string {
  return str
    .replace(EMAIL_PATTERN, '[email]')
    .replace(CARD_PATTERN, '[card]')
    .replace(TOKEN_PATTERN, '[token]');
}

/**
 * Check if a key is a PII field (case-insensitive)
 */
function isPIIField(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return PII_FIELDS.some((field) => lowerKey.includes(field));
}

/**
 * Recursively sanitize an object, redacting PII fields and masking patterns
 */
export function sanitizeContext(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeContext(item, depth + 1));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Redact PII fields
      if (isPIIField(key)) {
        sanitized[key] = '[REDACTED]';
      } else {
        // Recursively sanitize nested values
        sanitized[key] = sanitizeContext(value, depth + 1);
      }
    }

    return sanitized;
  }

  // Fallback for functions, symbols, etc.
  return String(obj);
}

/**
 * Sanitize an error object for logging.
 * Extracts structured error information and removes PII from messages and stacks.
 */
export function sanitizeError(error: unknown): ErrorContext {
  // Handle Error instances
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeString(error.message),
      stack: error.stack ? sanitizeString(error.stack) : undefined,
      // Check for custom error properties (AppError pattern)
      code: 'code' in error ? String(error.code) : undefined,
      statusCode:
        'statusCode' in error && typeof error.statusCode === 'number'
          ? error.statusCode
          : undefined,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: sanitizeString(error),
    };
  }

  // Handle unknown error types
  return {
    name: 'UnknownError',
    message: 'Non-error value thrown',
  };
}
