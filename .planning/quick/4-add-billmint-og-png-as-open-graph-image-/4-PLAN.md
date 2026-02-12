---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/layout.tsx
  - src/components/landing-page.tsx
  - src/app/privacy/page.tsx
  - src/app/terms/page.tsx
  - src/app/help-center/page.tsx
autonomous: true

must_haves:
  truths:
    - "Sharing billmint.io on social media shows the billmint_og.png image"
    - "All pages inherit the OG image from root layout metadata"
    - "JSON-LD schemas include image property for richer search results"
  artifacts:
    - path: "src/app/layout.tsx"
      provides: "Root OG and Twitter image metadata"
      contains: "billmint_og.png"
    - path: "src/components/landing-page.tsx"
      provides: "Organization image and SoftwareApplication screenshot in JSON-LD"
      contains: "billmint_og.png"
    - path: "src/app/privacy/page.tsx"
      provides: "WebPage JSON-LD with image"
      contains: "billmint_og.png"
    - path: "src/app/terms/page.tsx"
      provides: "WebPage JSON-LD with image"
      contains: "billmint_og.png"
    - path: "src/app/help-center/page.tsx"
      provides: "WebPage JSON-LD with image"
      contains: "billmint_og.png"
  key_links:
    - from: "src/app/layout.tsx"
      to: "public/billmint_og.png"
      via: "Next.js metadata openGraph.images"
      pattern: "images.*billmint_og"
---

<objective>
Add billmint_og.png (1200x630) as the Open Graph image across all metadata and JSON-LD schemas.

Purpose: Social media shares and search results currently show no image preview. Adding the OG image ensures rich previews on Twitter, Facebook, LinkedIn, Slack, and other platforms.
Output: All pages serve OG/Twitter image metadata; JSON-LD schemas include image properties.
</objective>

<execution_context>
@/Users/albueduard/.claude/get-shit-done/workflows/execute-plan.md
@/Users/albueduard/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/layout.tsx
@src/components/landing-page.tsx
@src/app/privacy/page.tsx
@src/app/terms/page.tsx
@src/app/help-center/page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add OG and Twitter image to root layout metadata</name>
  <files>src/app/layout.tsx</files>
  <action>
In `src/app/layout.tsx`, add `images` to the `openGraph` metadata object and `images` to the `twitter` metadata object.

For `openGraph`, add after the `type: "website"` line:
```ts
images: [
  {
    url: "/billmint_og.png",
    width: 1200,
    height: 630,
    alt: "BillMint - Simple Time Tracking & Invoicing for Freelancers",
    type: "image/png",
  },
],
```

For `twitter`, add after the `description` line:
```ts
images: ["/billmint_og.png"],
```

Since `metadataBase` is already set to `https://billmint.io`, Next.js will resolve the relative `/billmint_og.png` path to the full URL automatically. Child page layouts inherit this image through Next.js metadata merging, so no changes needed to `signup/layout.tsx`, `privacy/layout.tsx`, `terms/layout.tsx`, or `help-center/layout.tsx`.
  </action>
  <verify>Run `npx next build 2>&1 | tail -20` to confirm the build succeeds. Then grep for "billmint_og" in `src/app/layout.tsx` to confirm the image is referenced.</verify>
  <done>Root layout metadata includes openGraph.images and twitter.images pointing to /billmint_og.png with correct dimensions (1200x630).</done>
</task>

<task type="auto">
  <name>Task 2: Add image properties to all JSON-LD schemas</name>
  <files>src/components/landing-page.tsx, src/app/privacy/page.tsx, src/app/terms/page.tsx, src/app/help-center/page.tsx</files>
  <action>
In `src/components/landing-page.tsx`:

1. In `organizationSchema` (line ~31), add after the `"description"` property:
```ts
"image": "https://billmint.io/billmint_og.png",
```

2. In `softwareApplicationSchema` (line ~40), add after the `"description"` property:
```ts
"screenshot": "https://billmint.io/billmint_og.png",
```

In `src/app/privacy/page.tsx`:

In `webPageSchema` (line ~4), add after the `"publisher"` block (before the closing `};`):
```ts
"image": "https://billmint.io/billmint_og.png",
```

In `src/app/terms/page.tsx`:

In `webPageSchema` (line ~4), add after the `"publisher"` block (before the closing `};`):
```ts
"image": "https://billmint.io/billmint_og.png",
```

In `src/app/help-center/page.tsx`:

In `webPageSchema` (line ~104), add after the `"publisher"` block (before the closing `};`):
```ts
"image": "https://billmint.io/billmint_og.png",
```

Use full absolute URLs in JSON-LD (not relative paths) because JSON-LD does not have a concept of base URL — search engine crawlers need the complete URL.
  </action>
  <verify>Run `npx next build 2>&1 | tail -20` to confirm no build errors. Grep for "billmint_og" across all modified files to confirm all 5 references are present (1 in landing-page Organization, 1 in landing-page SoftwareApplication, 1 in privacy, 1 in terms, 1 in help-center).</verify>
  <done>All JSON-LD schemas include image/screenshot property with full URL https://billmint.io/billmint_og.png. Organization has "image", SoftwareApplication has "screenshot", all WebPage schemas have "image".</done>
</task>

</tasks>

<verification>
1. `npx next build` completes without errors
2. Grep for "billmint_og" across src/ returns exactly 7 occurrences: 2 in layout.tsx (openGraph + twitter), 2 in landing-page.tsx (Organization + SoftwareApplication), 1 in privacy/page.tsx, 1 in terms/page.tsx, 1 in help-center/page.tsx
3. Run `npx next start` and curl the homepage to verify og:image meta tag is present: `curl -s http://localhost:3000 | grep -o 'og:image[^"]*"[^"]*"'`
</verification>

<success_criteria>
- All pages serve `<meta property="og:image" content="https://billmint.io/billmint_og.png">` via Next.js metadata cascade
- Twitter card includes image reference
- All JSON-LD schemas include image property with full absolute URL
- Build passes with no errors
</success_criteria>

<output>
After completion, create `.planning/quick/4-add-billmint-og-png-as-open-graph-image-/4-SUMMARY.md`
</output>
