/**
 * PostHog configuration with environment gating.
 * Only initializes PostHog in production with valid credentials.
 */

/**
 * Production environment check.
 * Uses VERCEL_ENV for proper Vercel environment detection.
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * PostHog API key.
 * Public key from PostHog Dashboard -> Project Settings -> Project API Key.
 */
export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;

/**
 * PostHog instance URL.
 * Defaults to US cloud instance if not configured.
 */
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
