export type ConsentStatus = 'accepted' | 'declined' | null;

export const CONSENT_KEY = 'cookie-consent';

/**
 * Reads the cookie consent status from localStorage.
 * Returns null if no choice has been made yet or if running on server.
 */
export function getConsent(): ConsentStatus {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === 'accepted' || stored === 'declined') {
      return stored;
    }
    return null;
  } catch {
    // Private browsing or localStorage access blocked
    return null;
  }
}

/**
 * Stores the user's cookie consent choice in localStorage.
 */
export function setConsent(status: 'accepted' | 'declined'): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(CONSENT_KEY, status);
  } catch {
    // Private browsing or localStorage access blocked
  }
}

/**
 * Returns true if the user has accepted cookies.
 */
export function hasConsented(): boolean {
  return getConsent() === 'accepted';
}
