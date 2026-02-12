'use client';

import { useEffect, useState, type ReactNode } from 'react';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { isProduction, POSTHOG_KEY, POSTHOG_HOST } from '@/lib/analytics/posthog';
import { getConsent } from '@/lib/cookie-consent';

export function PHProvider({ children }: { children: ReactNode }) {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    // Only initialize PostHog in production with valid key AND with user consent
    if (isProduction && POSTHOG_KEY) {
      const consent = getConsent();

      if (consent === 'accepted') {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          defaults: '2026-01-30',
          persistence: 'localStorage+cookie',
          opt_out_capturing_by_default: false,
          // // Anonymous-only tracking - no user profiles created
          // person_profiles: 'identified_only',
          // // Disable auto page view capture (manual tracking required for App Router)
          // capture_pageview: false,
          // // Track when users leave pages
          // capture_pageleave: true,
          // // Privacy: disable session recordings
          // disable_session_recording: true,
          // // Prevent hydration issues from injected scripts
          // disable_external_dependency_loading: true,
        });
        setConsentGiven(true);
      } else {
        setConsentGiven(false);
      }
    }
  }, []);

  // Listen for consent changes (from cookie banner)
  useEffect(() => {
    const handleConsentChange = () => {
      const consent = getConsent();

      if (consent === 'accepted' && !consentGiven && isProduction && POSTHOG_KEY) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          defaults: '2026-01-30',
          persistence: 'localStorage+cookie',
          opt_out_capturing_by_default: false,
        });
        setConsentGiven(true);
      } else if (consent === 'declined' && consentGiven) {
        posthog.opt_out_capturing();
        setConsentGiven(false);
      }
    };

    window.addEventListener('cookie-consent-change', handleConsentChange);
    return () => window.removeEventListener('cookie-consent-change', handleConsentChange);
  }, [consentGiven]);

  // If not production or missing key, passthrough (no PostHog context)
  if (!isProduction || !POSTHOG_KEY) {
    return <>{children}</>;
  }

  // Only provide PostHog context when consent is given
  if (consentGiven === true) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
  }

  return <>{children}</>;
}
