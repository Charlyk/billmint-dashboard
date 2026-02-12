---
phase: quick-4
plan: 01
subsystem: seo
tags: [og-image, twitter-card, json-ld, social-sharing]
dependency_graph:
  requires: []
  provides: [og-image-metadata, json-ld-images]
  affects: [all-pages]
tech_stack:
  added: []
  patterns: [next-metadata-cascade, json-ld-structured-data]
key_files:
  created: []
  modified:
    - path: src/app/layout.tsx
      purpose: Added OG and Twitter image metadata
    - path: src/components/landing-page.tsx
      purpose: Added image/screenshot to Organization and SoftwareApplication schemas
    - path: src/app/privacy/page.tsx
      purpose: Added image to WebPage schema
    - path: src/app/terms/page.tsx
      purpose: Added image to WebPage schema
    - path: src/app/help-center/page.tsx
      purpose: Added image to WebPage schema
decisions: []
metrics:
  duration_minutes: 2.7
  completed_date: 2026-02-12
---

# Phase quick-4 Plan 01: Add billmint_og.png as Open Graph Image Summary

**One-liner:** Added billmint_og.png (1200x630) as OG/Twitter image in metadata and all JSON-LD schemas for rich social media previews

## Tasks Completed

| Task | Name | Commit | Files Modified |
|------|------|--------|----------------|
| 1 | Add OG and Twitter image to root layout metadata | 3b32693 | src/app/layout.tsx |
| 2 | Add image properties to all JSON-LD schemas | 9955397 | src/components/landing-page.tsx, src/app/privacy/page.tsx, src/app/terms/page.tsx, src/app/help-center/page.tsx |

## What Was Built

### Open Graph & Twitter Card Metadata

Updated `src/app/layout.tsx` to include:
- **openGraph.images**: Added billmint_og.png with full metadata (url, width: 1200, height: 630, alt text, type: image/png)
- **twitter.images**: Added billmint_og.png for Twitter card support

Since `metadataBase` is set to `https://billmint.io`, Next.js automatically resolves relative paths to full URLs. All child pages inherit this image through Next.js metadata merging.

### JSON-LD Structured Data

Added image properties to all JSON-LD schemas for enhanced search results:

1. **Organization schema** (landing page): Added `"image"` property
2. **SoftwareApplication schema** (landing page): Added `"screenshot"` property
3. **WebPage schemas** (privacy, terms, help-center): Added `"image"` property

All JSON-LD schemas use full absolute URLs (`https://billmint.io/billmint_og.png`) as required by the JSON-LD specification.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

**Build status:** Success
**OG references:** 7 total (2 in layout.tsx, 2 in landing-page.tsx, 1 each in privacy/terms/help-center)
**Metadata cascade:** All pages inherit OG image from root layout via Next.js metadata merging

Social sharing on Twitter, Facebook, LinkedIn, and Slack will now show:
- Title: "BillMint - Simple Time Tracking & Invoicing"
- Description: "Free time tracking software with invoicing..."
- Image: billmint_og.png (1200x630)

Search engines crawling JSON-LD will find image properties in all schemas for richer search result cards.

## Self-Check

Verifying claimed files exist:

- [x] src/app/layout.tsx modified
- [x] src/components/landing-page.tsx modified
- [x] src/app/privacy/page.tsx modified
- [x] src/app/terms/page.tsx modified
- [x] src/app/help-center/page.tsx modified

Verifying commits exist:

- [x] 3b32693: feat(quick-4): add OG and Twitter image to root layout metadata
- [x] 9955397: feat(quick-4): add image properties to all JSON-LD schemas

## Self-Check: PASSED

All claimed files exist and all commits are present in git history.
