---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - public/llms.txt
  - public/llms-full.txt
  - src/app/layout.tsx
  - src/app/signup/layout.tsx
  - src/app/privacy/layout.tsx
  - src/app/privacy/page.tsx
  - src/app/terms/layout.tsx
  - src/app/terms/page.tsx
  - src/app/help-center/layout.tsx
  - src/app/help-center/page.tsx
autonomous: true
must_haves:
  truths:
    - "All public page metadata includes keyword-rich descriptions derived from KW.md"
    - "llms.txt and llms-full.txt are accessible at /llms.txt and /llms-full.txt"
    - "Privacy, Terms, and Help Center pages have JSON-LD structured data"
    - "All public page layouts include canonical URLs and OG/Twitter metadata"
  artifacts:
    - path: "public/llms.txt"
      provides: "Concise AI-readable product summary"
    - path: "public/llms-full.txt"
      provides: "Comprehensive AI-readable product description"
    - path: "src/app/privacy/layout.tsx"
      provides: "Enhanced metadata with canonical, OG, Twitter, keywords"
    - path: "src/app/terms/layout.tsx"
      provides: "Enhanced metadata with canonical, OG, Twitter, keywords"
    - path: "src/app/help-center/layout.tsx"
      provides: "Enhanced metadata with canonical, OG, Twitter, keywords"
  key_links:
    - from: "public/llms.txt"
      to: "https://billmint.io/llms.txt"
      via: "Next.js static file serving"
    - from: "help-center/page.tsx"
      to: "JSON-LD FAQPage schema"
      via: "script type=application/ld+json in JSX"
---

<objective>
Enhanced SEO: integrate KW.md keywords into all public page metadata, create llms.txt files for AI discoverability, add JSON-LD structured data to remaining public pages, and ensure comprehensive OG/Twitter/canonical metadata on every public page.

Purpose: Improve search engine rankings with keyword-optimized metadata, enable AI assistant discoverability via llms.txt standard, and add rich search result eligibility via JSON-LD on all public pages.
Output: 2 new static files (llms.txt, llms-full.txt), updated metadata on 5 layout files, JSON-LD on 3 page components.
</objective>

<execution_context>
@/Users/albueduard/.claude/get-shit-done/workflows/execute-plan.md
@/Users/albueduard/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/layout.tsx (root metadata pattern with metadataBase, title template, keywords, OG, Twitter)
@src/components/landing-page.tsx (existing JSON-LD pattern: Organization, SoftwareApplication, FAQPage schemas)
@src/app/signup/layout.tsx (current minimal metadata)
@src/app/privacy/layout.tsx (current minimal metadata)
@src/app/terms/layout.tsx (current minimal metadata)
@src/app/help-center/layout.tsx (current minimal metadata)
@src/app/help-center/page.tsx (9 FAQ items to use for FAQPage JSON-LD)
@KW.md (209 keyword entries for metadata optimization)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create llms.txt and llms-full.txt static files</name>
  <files>public/llms.txt, public/llms-full.txt</files>
  <action>
Create two plain text files in `public/` following the llms.txt standard (see https://llmstxt.org/).

**public/llms.txt** -- concise summary (~20-30 lines):
```
# BillMint

> Simple time tracking and invoicing for freelancers and small teams.

BillMint is a web-based time tracking software with invoicing built in. Freelancers, consultants, and small teams use it to track billable hours, create professional invoices, and get paid faster.

## Key Features

- Time tracking with one-click timer or manual entry
- Professional invoice creation with customizable templates
- Client and project management
- Recurring invoices (weekly, monthly, quarterly, yearly)
- Multi-currency support (USD, EUR, GBP, RON)
- Billable hours to invoice conversion
- PDF invoice export
- Time reports and analytics

## Pricing

- Free plan: Unlimited time tracking, 1 user, basic reports
- Pro plan: $5/month - Unlimited invoices, clients, projects, PDF export, full reports

## Links

- Website: https://billmint.io
- Sign Up: https://billmint.io/signup
- Help Center: https://billmint.io/help-center
- Privacy Policy: https://billmint.io/privacy
- Terms of Service: https://billmint.io/terms
```

**public/llms-full.txt** -- comprehensive description (~80-120 lines). Include everything from the concise version PLUS:

- **Detailed Features** section expanding each feature with 1-2 sentences explaining how it works
- **Use Cases** section listing 6-8 ideal user profiles:
  - Freelance developers tracking billable hours across client projects
  - Freelance designers managing project time and invoicing clients
  - Consultants tracking time and billing for professional services
  - Virtual assistants logging hours for multiple clients
  - Small agencies managing team time and client invoicing
  - Accountants tracking billable hours for client work
  - Lawyers and legal professionals tracking case time
  - Any solo professional who needs time tracking with invoicing
- **How It Works** section: 3-step flow (Track Time -> Create Invoice -> Get Paid)
- **Technical Details**: Web application, works in any modern browser, no download required, data encrypted at rest and in transit
- **Comparison Keywords** section mentioning: "Alternative to Toggl, Harvest, Clockify for freelancers who also need invoicing built-in. Unlike standalone time trackers, BillMint combines time tracking software with invoicing in one tool."
- **FAQ summary** section with the 6 FAQs from the landing page

Both files must be plain text (not markdown rendered, but markdown-formatted for readability by LLMs). No HTML.
  </action>
  <verify>
Verify files exist: `ls -la public/llms.txt public/llms-full.txt`
Verify llms.txt is under 40 lines: `wc -l public/llms.txt`
Verify llms-full.txt is 80-150 lines: `wc -l public/llms-full.txt`
Run `npm run build` to confirm no build errors.
  </verify>
  <done>Both files exist in public/, are well-structured plain text, and will be served at /llms.txt and /llms-full.txt by Next.js static file serving.</done>
</task>

<task type="auto">
  <name>Task 2: Enhance all public page metadata with KW.md keywords, canonical URLs, and OG/Twitter cards</name>
  <files>src/app/layout.tsx, src/app/signup/layout.tsx, src/app/privacy/layout.tsx, src/app/terms/layout.tsx, src/app/help-center/layout.tsx</files>
  <action>
Update metadata exports in each layout file. The root layout already has `metadataBase: new URL("https://billmint.io")` so child layouts only need relative canonical paths.

**src/app/layout.tsx** -- Update the `keywords` array to include high-value terms from KW.md. Replace the current 7-keyword array with a broader set of ~20 keywords that are relevant to BillMint (not niche verticals like construction/lawyers):
```typescript
keywords: [
  "time tracking software",
  "time tracking software app",
  "freelancer time tracking",
  "time tracking billing software",
  "time tracking software for billable hours",
  "time tracking and billing software for consultants",
  "time tracking software with invoicing",
  "freelance time tracking free",
  "invoicing software",
  "invoice generator",
  "freelance tools",
  "time tracker",
  "billing software",
  "best time tracking software",
  "time tracking software online",
  "task time tracking software",
  "freelancer time tracking software",
  "time tracking for freelance work",
  "time tracking software for projects",
  "free time tracking software",
],
```
Also update the root `description` to weave in more keyword phrases naturally:
```
"BillMint is free time tracking software with invoicing built in. Track billable hours, create professional invoices, and get paid faster. The best time tracking and billing software for freelancers, consultants, and small teams."
```
Update the `openGraph.description` and `twitter.description` to match a shorter keyword-rich version:
```
"Free time tracking software with invoicing. Track billable hours, create invoices, and get paid faster. Built for freelancers and consultants."
```

**src/app/signup/layout.tsx** -- Add alternates, keywords, and twitter card:
```typescript
export const metadata: Metadata = {
  title: "Sign Up Free",
  description: "Create your free BillMint account. Start tracking billable hours and sending professional invoices in seconds. Free time tracking software for freelancers.",
  alternates: {
    canonical: "/signup",
  },
  keywords: ["sign up", "free time tracking", "freelancer time tracking", "create account", "free invoicing software"],
  openGraph: {
    title: "Sign Up Free | BillMint",
    description: "Create your free BillMint account. Start tracking billable hours and sending invoices in seconds.",
    url: "https://billmint.io/signup",
  },
  twitter: {
    card: "summary",
    title: "Sign Up Free | BillMint",
    description: "Create your free BillMint account. Start tracking billable hours and sending invoices in seconds.",
  },
};
```

**src/app/privacy/layout.tsx** -- Add alternates, keywords, OG, and twitter:
```typescript
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "BillMint privacy policy. Learn how we protect your time tracking and invoicing data, what we collect, and your privacy rights.",
  alternates: {
    canonical: "/privacy",
  },
  keywords: ["privacy policy", "data protection", "time tracking privacy", "BillMint privacy"],
  openGraph: {
    title: "Privacy Policy | BillMint",
    description: "Learn how BillMint protects your time tracking and invoicing data.",
    url: "https://billmint.io/privacy",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | BillMint",
    description: "Learn how BillMint protects your time tracking and invoicing data.",
  },
};
```

**src/app/terms/layout.tsx** -- Add alternates, keywords, OG, and twitter:
```typescript
export const metadata: Metadata = {
  title: "Terms of Service",
  description: "BillMint terms of service. Terms and conditions for using our time tracking software and invoicing platform.",
  alternates: {
    canonical: "/terms",
  },
  keywords: ["terms of service", "terms and conditions", "time tracking terms", "BillMint terms"],
  openGraph: {
    title: "Terms of Service | BillMint",
    description: "Terms and conditions for using BillMint time tracking and invoicing platform.",
    url: "https://billmint.io/terms",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | BillMint",
    description: "Terms and conditions for using BillMint time tracking and invoicing platform.",
  },
};
```

**src/app/help-center/layout.tsx** -- Add alternates, keywords, OG, and twitter:
```typescript
export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help with BillMint time tracking software. Find answers about tracking billable hours, creating invoices, managing clients, and account settings.",
  alternates: {
    canonical: "/help-center",
  },
  keywords: ["help center", "FAQ", "time tracking help", "invoicing help", "BillMint support", "how to track time"],
  openGraph: {
    title: "Help Center | BillMint",
    description: "Find answers to common questions about BillMint time tracking and invoicing.",
    url: "https://billmint.io/help-center",
  },
  twitter: {
    card: "summary",
    title: "Help Center | BillMint",
    description: "Find answers to common questions about BillMint time tracking and invoicing.",
  },
};
```

Important: Each layout file keeps its existing `export default function ...Layout` component unchanged. Only the `metadata` export is updated.
  </action>
  <verify>
Run `npm run build` to verify all metadata exports are valid and no TypeScript errors.
Spot-check with: `grep -n "canonical" src/app/signup/layout.tsx src/app/privacy/layout.tsx src/app/terms/layout.tsx src/app/help-center/layout.tsx` to confirm all have canonical URLs.
Spot-check with: `grep -n "twitter" src/app/signup/layout.tsx src/app/privacy/layout.tsx src/app/terms/layout.tsx src/app/help-center/layout.tsx` to confirm all have Twitter metadata.
  </verify>
  <done>All 5 public layout files have keyword-rich descriptions (using KW.md terms), canonical URLs via alternates, and complete OG + Twitter card metadata.</done>
</task>

<task type="auto">
  <name>Task 3: Add JSON-LD structured data to Privacy, Terms, and Help Center pages</name>
  <files>src/app/privacy/page.tsx, src/app/terms/page.tsx, src/app/help-center/page.tsx</files>
  <action>
Add JSON-LD `<script type="application/ld+json">` blocks to the page components, following the same pattern used in `src/components/landing-page.tsx` (inline script tags with `dangerouslySetInnerHTML`).

**src/app/privacy/page.tsx** -- Add a WebPage schema at the top of the returned JSX (inside the outermost div, before other content):
```tsx
const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Privacy Policy - BillMint",
  "description": "BillMint privacy policy. Learn how we protect your time tracking and invoicing data.",
  "url": "https://billmint.io/privacy",
  "isPartOf": {
    "@type": "WebSite",
    "name": "BillMint",
    "url": "https://billmint.io",
  },
  "dateModified": "2025-01-01",
  "publisher": {
    "@type": "Organization",
    "name": "BillMint",
    "url": "https://billmint.io",
  },
};
```
Then render: `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />`

Check the actual page component first -- if it's a simple server component, add the schema variable and the script tag at the top of the JSX return. If the page has a `dateModified` visible in the content, use that date. Otherwise use a reasonable date like "2025-01-01".

**src/app/terms/page.tsx** -- Same WebPage schema pattern as privacy, but with terms-specific name/description/url:
```tsx
const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Terms of Service - BillMint",
  "description": "Terms and conditions for using BillMint time tracking and invoicing platform.",
  "url": "https://billmint.io/terms",
  "isPartOf": {
    "@type": "WebSite",
    "name": "BillMint",
    "url": "https://billmint.io",
  },
  "dateModified": "2025-01-01",
  "publisher": {
    "@type": "Organization",
    "name": "BillMint",
    "url": "https://billmint.io",
  },
};
```

**src/app/help-center/page.tsx** -- Add BOTH a WebPage schema AND a FAQPage schema. The FAQPage schema should use the existing `faqs` array (9 questions) already defined in the component. Build the schema from the `faqs` array dynamically:
```tsx
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer,
    },
  })),
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Help Center - BillMint",
  "description": "Get help with BillMint time tracking software. Find answers about tracking billable hours, creating invoices, and managing clients.",
  "url": "https://billmint.io/help-center",
  "isPartOf": {
    "@type": "WebSite",
    "name": "BillMint",
    "url": "https://billmint.io",
  },
  "publisher": {
    "@type": "Organization",
    "name": "BillMint",
    "url": "https://billmint.io",
  },
};
```
Then render both script tags at the top of the JSX return, before the existing content.

Important: Do NOT modify the existing page content, styling, or component structure. Only ADD the JSON-LD script tags.
  </action>
  <verify>
Run `npm run build` to verify no build errors.
Verify JSON-LD presence: `grep -c "application/ld+json" src/app/privacy/page.tsx src/app/terms/page.tsx src/app/help-center/page.tsx` -- each should have at least 1 match (help-center should have 2).
Verify schemas are valid by checking that the objects use correct `@type` values: `grep "@type" src/app/privacy/page.tsx src/app/terms/page.tsx src/app/help-center/page.tsx`
  </verify>
  <done>Privacy page has WebPage JSON-LD, Terms page has WebPage JSON-LD, Help Center page has both WebPage and FAQPage JSON-LD (using all 9 existing FAQ items). All schemas follow the same pattern as the landing page.</done>
</task>

</tasks>

<verification>
1. `npm run build` completes with no errors
2. All public pages have enhanced metadata: `grep -r "canonical" src/app/signup/layout.tsx src/app/privacy/layout.tsx src/app/terms/layout.tsx src/app/help-center/layout.tsx`
3. JSON-LD on all public pages: `grep -rl "application/ld+json" src/app/ src/components/landing-page.tsx` should return landing-page.tsx, privacy/page.tsx, terms/page.tsx, help-center/page.tsx
4. Static files accessible: `ls public/llms.txt public/llms-full.txt`
5. Root keywords expanded: `grep -c "keywords" src/app/layout.tsx` confirms keywords array present
</verification>

<success_criteria>
- public/llms.txt exists with concise BillMint summary (under 40 lines)
- public/llms-full.txt exists with comprehensive description (80-150 lines)
- Root layout.tsx has ~20 keyword-rich terms from KW.md
- All 4 public page layouts (signup, privacy, terms, help-center) have canonical URLs, OG cards, and Twitter cards
- Privacy and Terms pages have WebPage JSON-LD schema
- Help Center page has both WebPage and FAQPage JSON-LD schema (9 questions)
- `npm run build` passes with zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/3-enhanced-seo-kw-md-keywords-llms-txt-fil/3-SUMMARY.md`
</output>
