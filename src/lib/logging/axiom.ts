/**
 * Axiom client singleton with environment gating.
 * Only initializes Axiom in production with valid credentials.
 */

import { Axiom } from '@axiomhq/js';

/**
 * Production environment check.
 * Uses VERCEL_ENV for proper Vercel environment detection.
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Axiom dataset name.
 * Defaults to 'billmint-logs' if not configured.
 */
export const AXIOM_DATASET = process.env.AXIOM_DATASET || 'billmint-logs';

/**
 * Axiom client singleton.
 * Only created in production when AXIOM_TOKEN is available.
 * Returns null in development or when token is missing.
 */
export const axiomClient: Axiom | null =
  isProduction && process.env.AXIOM_TOKEN
    ? new Axiom({ token: process.env.AXIOM_TOKEN })
    : null;
