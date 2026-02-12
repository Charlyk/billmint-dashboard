---
phase: quick-1
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/cookie-consent-banner.tsx
  - src/lib/cookie-consent.ts
  - src/contexts/posthog-provider.tsx
  - src/app/layout.tsx
autonomous: true

must_haves:
  truths:
    - "First-time visitor sees a cookie consent banner at the bottom of the page"
    - "Clicking Accept stores consent and hides the banner"
    - "Clicking Decline stores refusal and hides the banner"
    - "PostHog does NOT initialize or set cookies until the user accepts"
    - "If the user declines, PostHog is opted out (no cookies, no tracking)"
    - "If the user previously accepted, PostHog initializes on page load without showing the banner"
    - "Essential cookies (auth/session via Supabase) always work regardless of consent"
    - "Banner does not re-appear once a choice is made (persisted in localStorage)"
  artifacts:
    - path: "src/lib/cookie-consent.ts"
      provides: "Consent state management (read/write localStorage, types)"
      exports: ["getConsent", "setConsent", "CONSENT_KEY", "ConsentStatus"]
    - path: "src/components/cookie-consent-banner.tsx"
      provides: "Fixed bottom banner UI with Accept/Decline buttons"
      min_lines: 40
    - path: "src/contexts/posthog-provider.tsx"
      provides: "PostHog provider gated on consent status"
  key_links:
    - from: "src/components/cookie-consent-banner.tsx"
      to: "src/lib/cookie-consent.ts"
      via: "imports getConsent/setConsent"
      pattern: "import.*cookie-consent"
    - from: "src/contexts/posthog-provider.tsx"
      to: "src/lib/cookie-consent.ts"
      via: "checks consent before posthog.init"
      pattern: "getConsent|consentStatus"
    - from: "src/contexts/posthog-provider.tsx"
      to: "posthog-js"
      via: "opt_out_capturing / opt_in_capturing based on consent"
      pattern: "opt_out_capturing|opt_in_capturing"
    - from: "src/app/layout.tsx"
      to: "src/components/cookie-consent-banner.tsx"
      via: "renders CookieConsentBanner inside body"
      pattern: "CookieConsentBanner"
---

<objective>
Add a cookie consent banner that gates PostHog analytics behind user consent.

Purpose: Users must be able to opt in or out of analytics cookies. Without consent, PostHog must not initialize or store any cookies. Essential cookies (Supabase auth/session) remain unaffected.

Output: Cookie consent banner component, consent state utility, updated PostHog provider with consent gating.
</objective>

<execution_context>
@/Users/albueduard/.claude/get-shit-done/workflows/execute-plan.md
@/Users/albueduard/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/contexts/posthog-provider.tsx
@src/lib/analytics/posthog.ts
@src/lib/analytics/events.ts
@src/app/layout.tsx
@src/components/offline-banner.tsx
@src/components/ui/button.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create cookie consent utility and banner component</name>
  <files>src/lib/cookie-consent.ts, src/components/cookie-consent-banner.tsx</files>
  <action>
**1. Create `src/lib/cookie-consent.ts`** -- Consent state utility.

Define a `ConsentStatus` type: `'accepted' | 'declined' | null` (null = no choice yet).

Export constants and functions:
- `CONSENT_KEY = 'cookie-consent'` -- localStorage key
- `getConsent(): ConsentStatus` -- reads from localStorage, returns null if not set or if `typeof window === 'undefined'`
- `setConsent(status: 'accepted' | 'declined'): void` -- writes to localStorage
- `hasConsented(): boolean` -- returns `getConsent() === 'accepted'`

Wrap localStorage access in try/catch (private browsing can throw).

**2. Create `src/components/cookie-consent-banner.tsx`** -- `'use client'` component.

The banner should:
- Use `useState` initialized from `getConsent()`. If consent is already set (not null), render nothing.
- Render a fixed-position bar at the bottom of the viewport (`fixed bottom-0 inset-x-0 z-50`).
- Use Tailwind classes consistent with the app's design system: `bg-background border-t border-border` for the container, dark mode compatible.
- Show text: "We use cookies to analyze site usage and improve your experience." with a link to `/privacy` ("Privacy Policy").
- Two buttons using the project's `Button` component from `@/components/ui/button`:
  - "Decline" (variant="outline", size="sm") -- calls `setConsent('declined')`, updates state, dispatches a custom window event `'cookie-consent-change'` so the PostHog provider can react.
  - "Accept" (variant="default", size="sm") -- calls `setConsent('accepted')`, updates state, dispatches same custom event `'cookie-consent-change'`.
- After either button click, the banner hides (state update to non-null hides it).
- Layout: flex container, centered content, max-width for readability, responsive padding. On mobile the text and buttons stack vertically; on sm+ they're in a single row.
- Use `p-4 sm:px-6` padding pattern. Shadow on top edge (`shadow-[0_-2px_10px_rgba(0,0,0,0.1)]`) for visual separation.
- Import Link from `next/link` for the privacy policy link.
  </action>
  <verify>
Run `npx tsc --noEmit` -- no type errors in new files. Visually: the banner appears at the bottom of any page when localStorage has no `cookie-consent` key.
  </verify>
  <done>
Cookie consent utility exports getConsent/setConsent/hasConsented. Banner component renders with Accept/Decline buttons, hides after choice, persists to localStorage.
  </done>
</task>

<task type="auto">
  <name>Task 2: Gate PostHog on consent and wire banner into layout</name>
  <files>src/contexts/posthog-provider.tsx, src/app/layout.tsx</files>
  <action>
**1. Update `src/contexts/posthog-provider.tsx`** -- Gate PostHog initialization on consent.

The current provider calls `posthog.init()` in a `useEffect` unconditionally (when production + key present). Modify it:

- Import `getConsent` and `CONSENT_KEY` from `@/lib/cookie-consent`.
- Add a `consentGiven` state (`useState<boolean | null>(null)`) initialized to `null`.
- In the existing `useEffect`, BEFORE calling `posthog.init()`:
  - Read consent: `const consent = getConsent()`.
  - If `consent !== 'accepted'`, do NOT call `posthog.init()`. Set `consentGiven` to `false`.
  - If `consent === 'accepted'`, proceed with `posthog.init()` as before, then set `consentGiven` to `true`.
- Add a SECOND `useEffect` that listens for the custom `'cookie-consent-change'` window event. When fired:
  - Re-read consent via `getConsent()`.
  - If now `'accepted'` and PostHog is not yet initialized: call `posthog.init()` with same config, set `consentGiven` to `true`.
  - If now `'declined'` and PostHog IS initialized: call `posthog.opt_out_capturing()`, set `consentGiven` to `false`.
  - Clean up the event listener on unmount.
- Remove the stale `console.log` statements (lines 11-12 in current file).
- Keep the `defaults: '2026-01-30'` config option in the init call.
- The `PostHogProvider` wrapper should only wrap children when `consentGiven === true` (PostHog is initialized). Otherwise, render `<>{children}</>` as passthrough.

PostHog's `persistence` option: When initializing, add `persistence: 'localStorage+cookie'` (the default) so PostHog uses both. This is fine because we only init AFTER consent. Also add `opt_out_capturing_by_default: false` -- the gating is handled by our consent check, not PostHog's built-in mechanism.

**2. Update `src/app/layout.tsx`** -- Add the cookie consent banner.

- Import `CookieConsentBanner` from `@/components/cookie-consent-banner`.
- Add `<CookieConsentBanner />` as the LAST child inside `<body>`, after the `</PHProvider>` closing tag. The banner is independent of PostHog provider -- it must render regardless.

The final body structure should be:
```tsx
<body ...>
  <PHProvider>
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
    <Providers>{children}</Providers>
  </PHProvider>
  <CookieConsentBanner />
</body>
```
  </action>
  <verify>
Run `npx tsc --noEmit` -- no type errors. Run `npm run build` -- build succeeds.

Manual verification flow:
1. Clear localStorage `cookie-consent` key. Reload page. Banner appears. PostHog is NOT initialized (no `ph_*` cookies in devtools).
2. Click "Accept". Banner hides. PostHog initializes. `ph_*` cookies appear. `localStorage.getItem('cookie-consent')` returns `'accepted'`.
3. Reload. Banner does NOT appear. PostHog initializes immediately.
4. Set `localStorage.setItem('cookie-consent', 'declined')` and reload. Banner does NOT appear. PostHog does NOT initialize.
5. Clear localStorage key and reload. Banner reappears.
  </verify>
  <done>
PostHog only initializes after explicit user consent. Banner renders in root layout independent of PostHog provider. Accept triggers PostHog init in real-time. Decline prevents PostHog from running. Choice persists across sessions.
  </done>
</task>

</tasks>

<verification>
- `npx tsc --noEmit` passes with zero errors
- `npm run build` completes successfully
- No `ph_*` cookies set before user clicks Accept
- Supabase auth cookies (essential) work regardless of consent choice
- Banner shows only when no consent choice has been stored
- PostHog events fire after Accept, not before
- Declining then reloading: no PostHog cookies, no network requests to PostHog
</verification>

<success_criteria>
- Cookie consent banner visible on first visit, hidden after choice
- PostHog fully gated behind consent -- zero cookies/tracking without acceptance
- Essential cookies unaffected (Supabase auth works either way)
- Consent choice persists in localStorage across sessions
- Real-time consent change: clicking Accept mid-session starts PostHog without reload
- Build and type-check pass
</success_criteria>

<output>
After completion, create `.planning/quick/1-add-cookie-consent-banner-with-analytics/1-SUMMARY.md`
</output>
