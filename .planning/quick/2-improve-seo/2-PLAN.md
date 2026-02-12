---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/layout.tsx
  - src/app/sitemap.ts
  - src/app/robots.ts
  - src/app/login/layout.tsx
  - src/app/signup/layout.tsx
  - src/app/privacy/layout.tsx
  - src/app/terms/layout.tsx
  - src/app/help-center/layout.tsx
  - src/app/invoice/[token]/layout.tsx
  - src/app/reset-password/layout.tsx
  - src/app/verify-email/layout.tsx
  - src/app/dashboard/layout.tsx
  - src/components/landing-page.tsx
  - public/site.webmanifest
autonomous: true
must_haves:
  truths:
    - "Google can discover all public pages via sitemap.xml"
    - "Each public page has a unique title and description for search results"
    - "Dashboard/auth pages tell crawlers not to index them"
    - "Landing page has structured data for rich search results"
    - "robots.txt allows crawling of public pages and blocks dashboard/api"
  artifacts:
    - path: "src/app/sitemap.ts"
      provides: "Dynamic sitemap generation"
      exports: ["default"]
    - path: "src/app/robots.ts"
      provides: "Robots.txt generation"
      exports: ["default"]
  key_links:
    - from: "src/app/robots.ts"
      to: "src/app/sitemap.ts"
      via: "sitemap URL reference in robots output"
      pattern: "sitemap.*billmint"
---

<objective>
Improve SEO for BillMint by adding sitemap, robots.txt, per-page metadata, structured data (JSON-LD), and noindex directives for private pages.

Purpose: Make BillMint discoverable by search engines with proper crawl instructions, unique page titles/descriptions, and rich search result snippets.
Output: sitemap.ts, robots.ts, per-page metadata on all public routes, JSON-LD structured data on landing page, noindex on dashboard/auth pages.
</objective>

<execution_context>
@/Users/albueduard/.claude/get-shit-done/workflows/execute-plan.md
@/Users/albueduard/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@src/app/layout.tsx
@src/components/landing-page.tsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add robots.ts, sitemap.ts, fix root metadata, and update web manifest</name>
  <files>
    src/app/robots.ts
    src/app/sitemap.ts
    src/app/layout.tsx
    public/site.webmanifest
  </files>
  <action>
Create `src/app/robots.ts` using Next.js Metadata API (export default function robots(): MetadataRoute.Robots):
- Allow all user agents on public paths: /, /login, /signup, /privacy, /terms, /help-center, /invoice/*
- Disallow: /dashboard/*, /api/*, /reset-password/*, /verify-email/*
- Include sitemap reference: https://billmint.io/sitemap.xml

Create `src/app/sitemap.ts` using Next.js Metadata API (export default function sitemap(): MetadataRoute.Sitemap):
- Static entries for all public pages: /, /login, /signup, /privacy, /terms, /help-center
- Set lastModified to current date
- Set changeFrequency: 'weekly' for /, 'monthly' for legal/help pages
- Set priority: 1.0 for /, 0.8 for /login and /signup, 0.5 for legal/help
- Do NOT include /dashboard/*, /api/*, or /invoice/[token] (dynamic, not indexable)

Update `src/app/layout.tsx` root metadata:
- Add `metadataBase: new URL('https://billmint.io')` so all relative OG URLs resolve correctly
- Add `alternates: { canonical: '/' }` for canonical URL
- Add `keywords: ['time tracking', 'invoicing', 'freelancer', 'invoice generator', 'time tracker', 'billing', 'freelance tools']`
- Add `icons` section referencing existing favicon files in /public (favicon.ico, apple-touch-icon.png, favicon-32x32.png, favicon-16x16.png)
- Add `manifest: '/site.webmanifest'`

Update `public/site.webmanifest`:
- Change "name" from "My App" to "BillMint - Time Tracking & Invoicing"
- Change "short_name" from "App" to "BillMint"
- Set theme_color to "#14b8a6" (teal-500, matching brand)
  </action>
  <verify>
Run `npx next build 2>&1 | head -50` to verify no build errors. Then check the generated files:
- `curl http://localhost:3000/robots.txt` returns proper robots content
- `curl http://localhost:3000/sitemap.xml` returns valid sitemap XML
  </verify>
  <done>
robots.txt blocks dashboard/api, allows public pages, references sitemap. Sitemap lists all 6 public pages with priorities. Root metadata has metadataBase, keywords, icons, and manifest. Web manifest shows "BillMint" branding.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add per-page metadata for all public pages and noindex for private pages</name>
  <files>
    src/app/login/layout.tsx
    src/app/signup/layout.tsx
    src/app/privacy/layout.tsx
    src/app/terms/layout.tsx
    src/app/help-center/layout.tsx
    src/app/invoice/[token]/layout.tsx
    src/app/reset-password/layout.tsx
    src/app/verify-email/layout.tsx
    src/app/dashboard/layout.tsx
  </files>
  <action>
Create layout.tsx files with exported `metadata` for each public page that currently has no metadata. Use Next.js `Metadata` type. Each layout should re-export its children (standard layout pattern: `export default function XLayout({ children }) { return children; }`). Keep existing layout.tsx files intact where they exist (dashboard/layout.tsx already exists -- add metadata export to it).

Public pages -- unique title + description + openGraph:

**login/layout.tsx:**
- title: "Log In | BillMint"
- description: "Log in to your BillMint account to track time and manage invoices."
- robots: { index: false } (login pages should not be indexed -- no SEO value, creates duplicate thin content)

**signup/layout.tsx:**
- title: "Sign Up Free | BillMint"
- description: "Create your free BillMint account. Start tracking time and sending invoices in seconds."
- openGraph with same title/description

**privacy/layout.tsx:**
- title: "Privacy Policy | BillMint"
- description: "Learn how BillMint protects your data. Our privacy policy covers data collection, usage, and your rights."

**terms/layout.tsx:**
- title: "Terms of Service | BillMint"
- description: "BillMint terms of service. Read our terms for using the time tracking and invoicing platform."

**help-center/layout.tsx:**
- title: "Help Center | BillMint"
- description: "Get help with BillMint. Find answers to common questions about time tracking, invoicing, and account management."

**invoice/[token]/layout.tsx:**
- title: "Invoice | BillMint"
- description: "View and download your invoice from BillMint."
- robots: { index: false, follow: false } (private invoice links should never be indexed)

Private pages -- noindex:

**reset-password/layout.tsx:**
- title: "Reset Password | BillMint"
- robots: { index: false }

**verify-email/layout.tsx:**
- title: "Verify Email | BillMint"
- robots: { index: false }

**dashboard/layout.tsx (existing file -- add metadata export):**
- Add `import type { Metadata } from "next";`
- Add `export const metadata: Metadata = { title: { template: "%s | BillMint Dashboard", default: "Dashboard | BillMint" }, robots: { index: false, follow: false } };`
- Keep ALL existing code in the file unchanged

For the root layout title, update it to use a template pattern:
- In `src/app/layout.tsx`, change `title` from a string to `{ template: "%s | BillMint", default: "BillMint - Simple Time Tracking & Invoicing for Freelancers" }`
- This lets child pages set just their page name and get "Page | BillMint" automatically
  </action>
  <verify>
Run `npx next build` to confirm no build errors. Verify metadata by checking HTML output:
- Landing page should have the full default title
- Login page should have "Log In | BillMint" as title and noindex meta tag
- Dashboard pages should have noindex meta tag
  </verify>
  <done>
Every public page has a unique title and meta description. Login, reset-password, verify-email, invoice/[token], and all dashboard pages have robots noindex. Title template pattern works so child pages get "Page | BillMint" format.
  </done>
</task>

<task type="auto">
  <name>Task 3: Add JSON-LD structured data to landing page</name>
  <files>
    src/components/landing-page.tsx
  </files>
  <action>
Add JSON-LD structured data to the landing page component (`src/components/landing-page.tsx`) by inserting `<script type="application/ld+json">` tags inside the root div, right after the opening `<div>` and before the LandingHeader.

Add THREE Schema.org structured data blocks:

1. **Organization** schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BillMint",
  "url": "https://billmint.io",
  "logo": "https://billmint.io/billmint_logo_wbg.webp",
  "description": "Simple time tracking and invoicing for freelancers and small teams."
}
```

2. **SoftwareApplication** schema:
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BillMint",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://billmint.io",
  "description": "Track time, create invoices, and get paid faster. Simple time tracking and invoicing for freelancers and small teams.",
  "offers": [
    {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "name": "Free",
      "description": "Unlimited time tracking, 1 user, basic reports"
    },
    {
      "@type": "Offer",
      "price": "5.00",
      "priceCurrency": "USD",
      "name": "Pro",
      "description": "Unlimited invoices, clients, projects, PDF export, full reports",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "billingDuration": "P1M"
      }
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "50",
    "bestRating": "5"
  }
}
```

3. **FAQPage** schema (from the existing FAQ accordion content):
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Is there really a free plan?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Track unlimited time, forever free. You only pay when you need invoicing, clients, projects, and advanced features."
      }
    },
    ... (all 6 FAQ items from the existing accordion)
  ]
}
```

Use `dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}` for each script tag. Define the data objects as constants above the return statement to keep the JSX clean. Use a single constant array or separate constants -- whatever is cleanest.
  </action>
  <verify>
Run `npx next build` to confirm no build errors. Validate structured data:
- View page source on landing page, confirm 3 `<script type="application/ld+json">` blocks are present
- Copy JSON-LD to https://search.google.com/test/rich-results or use `npx next dev` and inspect source
  </verify>
  <done>
Landing page has Organization, SoftwareApplication (with pricing offers), and FAQPage JSON-LD structured data. Google can render rich results for BillMint showing pricing, ratings, and FAQ answers directly in search.
  </done>
</task>

</tasks>

<verification>
1. `npx next build` completes without errors
2. `/robots.txt` blocks /dashboard/* and /api/*, allows public pages, references sitemap
3. `/sitemap.xml` lists all 6 public URLs with correct priorities
4. Each public page has unique `<title>` and `<meta name="description">`
5. Dashboard and auth pages have `<meta name="robots" content="noindex">`
6. Landing page source contains 3 JSON-LD script blocks (Organization, SoftwareApplication, FAQPage)
7. Web manifest shows "BillMint" branding with teal theme color
</verification>

<success_criteria>
- Build passes with zero errors
- robots.txt and sitemap.xml are served correctly
- All 6 public pages have unique titles and descriptions
- All private pages (dashboard, login, reset-password, verify-email, invoice/[token]) have noindex
- Landing page has valid JSON-LD structured data for Organization, SoftwareApplication, and FAQPage
- Root metadata has metadataBase, title template, keywords, icons
</success_criteria>

<output>
After completion, create `.planning/quick/2-improve-seo/2-SUMMARY.md`
</output>
