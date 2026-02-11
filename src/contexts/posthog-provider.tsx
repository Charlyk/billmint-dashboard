'use client';

import { useEffect, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { isProduction, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/analytics/posthog';

export function PHProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Only initialize PostHog in production with valid key
    if (isProduction && POSTHOG_KEY) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Anonymous-only tracking - no user profiles created
        person_profiles: 'identified_only',
        // Disable auto page view capture (manual tracking required for App Router)
        capture_pageview: false,
        // Track when users leave pages
        capture_pageleave: true,
        // Privacy: disable session recordings
        disable_session_recording: true,
        // Prevent hydration issues from injected scripts
        disable_external_dependency_loading: true,
      });
    }
  }, []);

  // If not production or missing key, passthrough (no PostHog context)
  if (!isProduction || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
