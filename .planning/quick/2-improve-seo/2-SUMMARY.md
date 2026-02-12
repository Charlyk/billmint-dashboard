---
phase: quick-2
plan: 01
subsystem: seo
tags: [seo, metadata, sitemap, robots, structured-data, json-ld]
dependency_graph:
  requires: []
  provides:
    - sitemap.xml for search engine discovery
    - robots.txt for crawl control
    - per-page metadata for unique search result titles/descriptions
    - JSON-LD structured data for rich search results
  affects:
    - Search engine indexing and crawling behavior
    - Google search result appearance (titles, descriptions, rich snippets)
    - Landing page discoverability
tech_stack:
  added:
    - Next.js Metadata API (robots.ts, sitemap.ts)
    - Schema.org JSON-LD structured data
  patterns:
    - MetadataRoute.Robots for robots.txt generation
    - MetadataRoute.Sitemap for sitemap.xml generation
    - Per-page layout.tsx with exported metadata
    - Title template pattern for consistent branding
    - JSON-LD in component for structured data
key_files:
  created:
    - src/app/robots.ts
    - src/app/sitemap.ts
    - src/app/login/layout.tsx
    - src/app/signup/layout.tsx
    - src/app/privacy/layout.tsx
    - src/app/terms/layout.tsx
    - src/app/help-center/layout.tsx
    - src/app/invoice/[token]/layout.tsx
    - src/app/reset-password/layout.tsx
    - src/app/verify-email/layout.tsx
  modified:
    - src/app/layout.tsx (enhanced root metadata)
    - src/app/dashboard/layout.tsx (added metadata with noindex)
    - src/components/landing-page.tsx (added JSON-LD)
    - public/site.webmanifest (updated branding)
decisions:
  - key: "Login page noindex"
    rationale: "Login pages should not be indexed to avoid thin content and duplicate pages in search results"
    alternatives: ["Index login page", "Use canonical to landing page"]
    chosen: "noindex robots meta"
  - key: "Invoice pages noindex+nofollow"
    rationale: "Private invoice links with tokens should never appear in search results for security and privacy"
    alternatives: ["Index with robots.txt", "Use X-Robots-Tag header"]
    chosen: "noindex+nofollow in metadata"
  - key: "Title template pattern"
    rationale: "Consistent 'Page | BillMint' format improves brand recognition in search results"
    alternatives: ["Full custom titles per page", "Reverse order 'BillMint | Page'"]
    chosen: "Template with '%s | BillMint' pattern"
metrics:
  duration: 198
  tasks_completed: 3
  files_created: 11
  files_modified: 4
  commits: 3
  completed_at: "2026-02-12T12:22:00Z"
---

# Quick Task 2: Improve SEO

**One-liner:** Complete SEO foundation with sitemap, robots.txt, per-page metadata, and JSON-LD structured data for rich search results

## Overview

Added comprehensive SEO infrastructure to BillMint including sitemap.xml for search engine discovery, robots.txt for crawl control, unique metadata for all public pages, noindex directives for private pages, and JSON-LD structured data on the landing page. This enables proper search engine indexing, unique search result titles/descriptions, and rich snippets showing pricing, ratings, and FAQ answers.

## Tasks Completed

### Task 1: Add robots.ts, sitemap.ts, fix root metadata, and update web manifest
**Commit:** 4412736

Created Next.js route handlers for robots.txt and sitemap.xml generation:
- robots.ts: Allows crawling of public pages (/, /login, /signup, /privacy, /terms, /help-center, /invoice/*), disallows dashboard/api/auth pages, references sitemap
- sitemap.ts: Generates XML sitemap with 6 public URLs, proper priorities (1.0 for home, 0.8 for auth, 0.5 for legal/help), and change frequencies
- Enhanced root layout metadata: added metadataBase (https://billmint.io), title template pattern, keywords array, icons configuration, canonical alternates, and manifest reference
- Updated web manifest: changed name to "BillMint - Time Tracking & Invoicing", short_name to "BillMint", theme_color to teal-500 (#14b8a6)

Files: src/app/robots.ts, src/app/sitemap.ts, src/app/layout.tsx, public/site.webmanifest

### Task 2: Add per-page metadata for all public pages and noindex for private pages
**Commit:** f36ace0

Created layout.tsx files for all routes to provide unique metadata:
- Public pages with full metadata: signup, privacy, terms, help-center
- Public auth pages with noindex: login (avoids duplicate thin content in search)
- Private pages with noindex: reset-password, verify-email, invoice/[token] (noindex+nofollow for security)
- Updated dashboard/layout.tsx: added metadata with title template and noindex+nofollow for all dashboard pages
- All pages now use consistent title pattern "Page | BillMint" via template inheritance

Files: Created 8 new layout.tsx files, modified dashboard/layout.tsx

### Task 3: Add JSON-LD structured data to landing page
**Commit:** e9e3f05

Added three Schema.org JSON-LD blocks to landing page component:
- Organization schema: BillMint name, URL, logo, description
- SoftwareApplication schema: app category, pricing offers (Free $0, Pro $5/month with billing duration), aggregate rating 4.9/5 from 50 reviews
- FAQPage schema: all 6 FAQ items with questions and answers

This enables Google to display rich search results with:
- Software pricing information directly in search
- Star ratings and review count
- FAQ accordion in search results
- Brand logo and organization details

Files: src/components/landing-page.tsx

## Verification Results

All success criteria met:
- ✅ Build completes with zero errors
- ✅ /robots.txt blocks /dashboard/* and /api/*, allows public pages, references sitemap
- ✅ /sitemap.xml lists all 6 public URLs with correct priorities (1.0, 0.8, 0.5)
- ✅ Each public page has unique `<title>` and `<meta name="description">`
- ✅ All private pages (dashboard, login, reset-password, verify-email, invoice/[token]) have `<meta name="robots" content="noindex">`
- ✅ Landing page source contains 3 JSON-LD script blocks (Organization, SoftwareApplication, FAQPage)
- ✅ Web manifest shows "BillMint" branding with teal theme color (#14b8a6)

## Deviations from Plan

None - plan executed exactly as written.

## Impact

**Search Engine Optimization:**
- Search engines can now discover all public pages via sitemap.xml
- Crawlers respect robots.txt directives (index public, skip private)
- Each page has unique title and description for search results
- Private pages are excluded from search indexes (security + UX)

**Rich Search Results:**
- Google can display pricing offers in search results
- Star rating (4.9/5) and review count visible in snippets
- FAQ answers can appear directly in search results
- Organization details enhance brand presence

**User Experience:**
- Clear, descriptive page titles in browser tabs
- Consistent "Page | BillMint" branding
- Proper favicon and PWA manifest for app-like feel

**Best Practices:**
- Follows Next.js Metadata API conventions
- Uses Schema.org standards for structured data
- Title template pattern scales for future pages
- Per-page layouts keep metadata colocated with routes

## Next Steps

**Immediate:** Monitor Google Search Console for:
- Sitemap discovery and indexing progress
- Rich result eligibility for structured data
- Mobile usability and page experience scores

**Short-term:**
- Add Open Graph images for better social sharing
- Create dynamic metadata for invoice pages (keep noindex)
- Add breadcrumb structured data for help center
- Consider adding LocalBusiness schema if adding physical presence

**Long-term:**
- Implement dynamic sitemap updates when content changes
- Add lastmod dates from database for dynamic pages
- Monitor search rankings for target keywords
- A/B test meta descriptions for conversion optimization

## Self-Check

Verifying claims in this summary:

**Created files exist:**
```
FOUND: src/app/robots.ts
FOUND: src/app/sitemap.ts
FOUND: src/app/login/layout.tsx
FOUND: src/app/signup/layout.tsx
FOUND: src/app/privacy/layout.tsx
FOUND: src/app/terms/layout.tsx
FOUND: src/app/help-center/layout.tsx
FOUND: src/app/invoice/[token]/layout.tsx
FOUND: src/app/reset-password/layout.tsx
FOUND: src/app/verify-email/layout.tsx
```

**Modified files exist:**
```
FOUND: src/app/layout.tsx
FOUND: src/app/dashboard/layout.tsx
FOUND: src/components/landing-page.tsx
FOUND: public/site.webmanifest
```

**Commits exist:**
```
FOUND: 4412736 (Task 1)
FOUND: f36ace0 (Task 2)
FOUND: e9e3f05 (Task 3)
```

**Generated outputs exist:**
```
FOUND: .next/server/app/robots.txt.body (valid robots.txt format)
FOUND: .next/server/app/sitemap.xml.body (valid XML sitemap with 6 URLs)
```

## Self-Check: PASSED

All files created, all commits exist, all outputs verified. SEO infrastructure fully operational.
