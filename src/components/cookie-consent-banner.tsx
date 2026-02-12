'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getConsent, setConsent } from '@/lib/cookie-consent';

export function CookieConsentBanner() {
  const [consentStatus, setConsentStatus] = useState<'accepted' | 'declined' | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setConsentStatus(getConsent());
  }, []);

  // Don't render until client-side and if consent already given
  if (!isClient || consentStatus !== null) {
    return null;
  }

  const handleAccept = () => {
    setConsent('accepted');
    setConsentStatus('accepted');
    // Dispatch custom event for PostHog provider to listen to
    window.dispatchEvent(new Event('cookie-consent-change'));
  };

  const handleDecline = () => {
    setConsent('declined');
    setConsentStatus('declined');
    // Dispatch custom event for PostHog provider to listen to
    window.dispatchEvent(new Event('cookie-consent-change'));
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="mx-auto max-w-7xl p-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            We use cookies to analyze site usage and improve your experience.{' '}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
            >
              Decline
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAccept}
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
