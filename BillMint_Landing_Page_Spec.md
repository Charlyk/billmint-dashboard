# BillMint Landing Page Specification

## Overview

**Goal:** Convert visitors into free signups
**Target audience:** Freelancers, solo consultants, small agencies (2-10 people)
**Primary action:** Sign up free
**Secondary action:** See demo / watch video

---

## Core Messaging

### Value Proposition (One Liner)
**Track time. Send invoices. Get paid.**

### Supporting Statement
Simple time tracking and invoicing for freelancers and small teams. No bloat, no learning curve.

### Key Differentiators
1. **Simpler** - No features you'll never use
2. **Cheaper** - $5/month vs $10-12/user at competitors
3. **Faster** - Start timer in 1 click, invoice in 2 minutes

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ HERO                                                                │
├─────────────────────────────────────────────────────────────────────┤
│ SOCIAL PROOF BAR                                                    │
├─────────────────────────────────────────────────────────────────────┤
│ PROBLEM → SOLUTION                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ FEATURES (3 main)                                                   │
├─────────────────────────────────────────────────────────────────────┤
│ HOW IT WORKS                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ PRICING                                                             │
├─────────────────────────────────────────────────────────────────────┤
│ TESTIMONIALS                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ FAQ                                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ FINAL CTA                                                           │
├─────────────────────────────────────────────────────────────────────┤
│ FOOTER                                                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Header (Sticky)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 🌿 BillMint          Features   Pricing   Login      [Get Started] │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- Logo (left)
- Nav links: Features, Pricing (anchor links)
- Login (text link)
- Get Started (teal button, primary CTA)

**Behavior:**
- Sticky on scroll
- Subtle shadow when scrolled
- Mobile: hamburger menu

---

## Section 2: Hero

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    Track time. Send invoices.                       │
│                          Get paid.                                  │
│                                                                     │
│       Simple time tracking and invoicing for freelancers            │
│              and small teams. Start free, upgrade when              │
│                        you're ready.                                │
│                                                                     │
│              [Start Free]        [See How It Works]                 │
│                                                                     │
│                    No credit card required                          │
│                                                                     │
│              ┌─────────────────────────────────────┐                │
│              │                                     │                │
│              │        APP SCREENSHOT/VIDEO         │                │
│              │         (Dashboard or Timer)        │                │
│              │                                     │                │
│              └─────────────────────────────────────┘                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Copy:**

**Headline:** Track time. Send invoices. Get paid.

**Subheadline:** Simple time tracking and invoicing for freelancers and small teams. Start free, upgrade when you're ready.

**CTA 1 (Primary):** Start Free
**CTA 2 (Secondary):** See How It Works (scrolls to How It Works section or opens video)

**Trust text:** No credit card required

**Visual:** 
- Clean screenshot of dashboard with timer running
- OR short looping video/GIF showing: start timer → stop → create invoice
- Subtle floating animation on the screenshot

---

## Section 3: Social Proof Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   "Trusted by 500+ freelancers"    ★★★★★ 4.9/5 rating              │
│                                                                     │
│   [Logo] [Logo] [Logo] [Logo] [Logo]  ← tools they integrate with  │
│   Asana   Jira  Trello  Chrome  Firefox                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Elements:**
- User count or "Join X freelancers" (update as you grow)
- Star rating (once you have reviews)
- Integration logos (Asana, Jira, Trello - for browser extension)

**Note:** If no real numbers yet, skip this section or use:
- "Built for freelancers, by a freelancer"
- Integration logos only

---

## Section 4: Problem → Solution

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    Tired of complicated tools?                      │
│                                                                     │
│   ┌─────────────────────┐        ┌─────────────────────┐           │
│   │ ❌ The Problem       │        │ ✅ The Solution      │           │
│   │                     │        │                     │           │
│   │ Harvest is $12/user │   →    │ BillMint is $5 flat │           │
│   │                     │        │ + $1 per teammate   │           │
│   │ Toggl needs 10 tabs │   →    │ Everything in one   │           │
│   │ to send an invoice  │        │ place               │           │
│   │                     │        │                     │           │
│   │ Features you'll     │   →    │ Only what you need, │           │
│   │ never use           │        │ nothing more        │           │
│   │                     │        │                     │           │
│   └─────────────────────┘        └─────────────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Headline:** Tired of complicated tools?

**Problem/Solution pairs:**

| Problem | Solution |
|---------|----------|
| Harvest costs $12/user/month | BillMint is $5 + $1/user |
| Toggl needs 10 clicks to invoice | One-click invoice from tracked time |
| Features you'll never use | Only what you need, nothing more |
| Timers that forget your work | Auto-save, never lose a minute |

**Visual:** Side-by-side comparison or animated transition

---

## Section 5: Features

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                   Everything you need. Nothing you don't.           │
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │                 │  │                 │  │                 │    │
│   │    ⏱️ Timer      │  │  📄 Invoicing   │  │  🌐 Extension   │    │
│   │                 │  │                 │  │                 │    │
│   │ Start with one  │  │ Turn hours into │  │ Track time in   │    │
│   │ click. Track    │  │ invoices in     │  │ Asana, Jira,    │    │
│   │ to any project. │  │ seconds. Send   │  │ Trello without  │    │
│   │ Works even when │  │ professional    │  │ switching tabs. │    │
│   │ you forget to   │  │ PDFs your       │  │                 │    │
│   │ stop it.        │  │ clients will    │  │                 │    │
│   │                 │  │ love.           │  │                 │    │
│   │ [See timer →]   │  │ [See invoice →] │  │ [Get extension] │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Headline:** Everything you need. Nothing you don't.

### Feature 1: One-Click Timer

**Icon:** ⏱️ or custom timer icon
**Title:** One-Click Timer
**Description:** Start tracking in one click. Add details later. Auto-saves so you never lose a minute, even if you forget to stop.
**Visual:** GIF of timer starting with one click
**Link:** See timer in action →

### Feature 2: Instant Invoicing

**Icon:** 📄 or invoice icon
**Title:** Instant Invoicing
**Description:** Turn tracked time into professional invoices in seconds. Add your logo, send to clients, get paid faster.
**Visual:** Screenshot of invoice creation flow
**Link:** See sample invoice →

### Feature 3: Browser Extension

**Icon:** 🌐 or puzzle piece icon
**Title:** Track Where You Work
**Description:** Track time directly in Asana, Jira, and Trello. No tab switching, no copy-pasting. Coming soon.
**Visual:** Screenshot of extension in Asana
**Link:** Get notified when it launches →

---

## Section 6: How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                      Get paid in 3 steps                            │
│                                                                     │
│       ①                    ②                    ③                  │
│   ┌────────┐           ┌────────┐           ┌────────┐             │
│   │  ⏱️    │    →      │  📄    │    →      │  💰    │             │
│   └────────┘           └────────┘           └────────┘             │
│                                                                     │
│   Track Time           Create Invoice        Get Paid               │
│                                                                     │
│   Start the timer      Select unbilled       Send to client.        │
│   when you work.       hours. Click          Track payment.         │
│   Stop when done.      "Create Invoice".     Done.                  │
│                        That's it.                                   │
│                                                                     │
│                        [Start Free]                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Headline:** Get paid in 3 steps

**Steps:**

| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | ⏱️ | Track Time | Start the timer when you work. Stop when done. Add project and notes anytime. |
| 2 | 📄 | Create Invoice | Select unbilled hours. Click "Create Invoice". Review, customize, send. |
| 3 | 💰 | Get Paid | Share invoice link with client. Track when it's viewed and paid. |

**CTA:** Start Free

**Visual option:** Animated sequence or video showing the 3-step flow

---

## Section 7: Pricing

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                    Simple, honest pricing                           │
│                                                                     │
│   No hidden fees. No per-seat surprises. Cancel anytime.           │
│                                                                     │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│   │                 │  │  ★ POPULAR      │  │                 │    │
│   │      FREE       │  │      PRO        │  │      TEAM       │    │
│   │                 │  │                 │  │                 │    │
│   │       $0        │  │       $5        │  │    $5 + $1      │    │
│   │     forever     │  │    /month       │  │   /user/month   │    │
│   │                 │  │                 │  │                 │    │
│   │ ✓ Unlimited     │  │ ✓ Everything    │  │ ✓ Everything    │    │
│   │   time tracking │  │   in Free       │  │   in Pro        │    │
│   │ ✓ 1 user        │  │ ✓ Unlimited     │  │ ✓ Up to 30      │    │
│   │                 │  │   invoices      │  │   team members  │    │
│   │                 │  │ ✓ Unlimited     │  │ ✓ Team reports  │    │
│   │                 │  │   clients &     │  │                 │    │
│   │                 │  │   projects      │  │                 │    │
│   │                 │  │ ✓ PDF export    │  │                 │    │
│   │                 │  │ ✓ Reports       │  │                 │    │
│   │                 │  │                 │  │                 │    │
│   │ [Start Free]    │  │ [Start Free]    │  │ [Contact Us]    │    │
│   │                 │  │                 │  │                 │    │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│                                                                     │
│            Compare: Harvest $12/user • Toggl $10/user              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Headline:** Simple, honest pricing

**Subheadline:** No hidden fees. No per-seat surprises. Cancel anytime.

### Plans:

**Free - $0 forever**
- ✓ Unlimited time tracking
- ✓ 1 user
- ✓ Basic reports

**Pro - $5/month** ← Mark as "Popular"
- ✓ Everything in Free
- ✓ Unlimited invoices
- ✓ Unlimited clients & projects
- ✓ PDF export
- ✓ Full reports

**Team - $5 + $1/user/month**
- ✓ Everything in Pro
- ✓ Up to 30 team members
- ✓ Team reports
- ✓ Coming soon

**Comparison line:** "Compare: Harvest $12/user • Toggl $10/user"

**CTA:** All plans → "Start Free" (everyone starts free)

---

## Section 8: Testimonials

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                   Loved by freelancers                              │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │  "Finally, a time tracker that doesn't try to be            │  │
│   │   everything. I track time, I invoice, I get paid.          │  │
│   │   That's it. That's all I needed."                          │  │
│   │                                                              │  │
│   │   — Sarah K., Freelance Designer                            │  │
│   │                                                              │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌───────────────────┐  ┌───────────────────┐                     │
│   │ "Switched from    │  │ "The invoicing    │                     │
│   │  Harvest. Saving  │  │  alone is worth   │                     │
│   │  $80/month."      │  │  the price."      │                     │
│   │                   │  │                   │                     │
│   │ — Mike R.         │  │ — Ana T.          │                     │
│   │   Agency Owner    │  │   Consultant      │                     │
│   └───────────────────┘  └───────────────────┘                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Headline:** Loved by freelancers

**Layout:** 1 large featured testimonial + 2-3 smaller ones

**Note:** If no real testimonials yet, either:
- Skip this section
- Use beta user feedback
- Add after launch with real quotes

**Testimonial structure:**
- Quote (specific, mentions benefit)
- Name (first name + last initial)
- Role (Freelance Designer, Agency Owner, etc.)
- Optional: Photo, company logo

---

## Section 9: FAQ

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                     Frequently Asked Questions                      │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ▸ Is there really a free plan?                              │  │
│   │                                                              │  │
│   │   Yes. Track unlimited time, forever free. You only pay     │  │
│   │   when you need invoicing and advanced features.            │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ▸ Can I import from Toggl/Harvest?                          │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ▸ How does the browser extension work?                      │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ▸ Is my data secure?                                        │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │ ▸ Can I cancel anytime?                                     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Headline:** Frequently Asked Questions

### FAQs:

**Q: Is there really a free plan?**
A: Yes. Track unlimited time, forever free. You only pay when you need invoicing, clients, projects, and advanced features.

**Q: Can I import my data from Toggl or Harvest?**
A: Not yet, but it's on our roadmap. For now, you can start fresh or manually add past entries.

**Q: How does the browser extension work?**
A: Install the extension, and you'll see a timer button in Asana, Jira, and Trello. Click to track time—it syncs automatically to BillMint. (Coming soon)

**Q: Is my data secure?**
A: Yes. We use industry-standard encryption, secure hosting on [Vercel/AWS], and never share your data with third parties.

**Q: Can I cancel anytime?**
A: Absolutely. No contracts, no cancellation fees. Cancel from your settings in one click.

**Q: Do you offer refunds?**
A: Yes. If you're not happy within the first 14 days, we'll refund you—no questions asked.

---

## Section 10: Final CTA

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                                                                     │
│                  Ready to get paid for your time?                   │
│                                                                     │
│          Start tracking in seconds. No credit card needed.          │
│                                                                     │
│                         [Start Free]                                │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Headline:** Ready to get paid for your time?

**Subheadline:** Start tracking in seconds. No credit card needed.

**CTA:** Start Free (large, centered button)

**Background:** Subtle teal gradient or pattern to make it stand out

---

## Section 11: Footer

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   🌿 BillMint                                                       │
│   Simple time tracking                                              │
│   and invoicing.                                                    │
│                                                                     │
│   Product          Resources         Legal                          │
│   Features         Help Center       Privacy Policy                 │
│   Pricing          Blog              Terms of Service               │
│   Login            Changelog         Cookie Policy                  │
│   Sign Up                                                           │
│                                                                     │
│   ─────────────────────────────────────────────────────────────    │
│                                                                     │
│   © 2026 BillMint. All rights reserved.                            │
│                                                                     │
│   🇷🇴 Made in Romania                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Columns:**

**Product**
- Features
- Pricing
- Login
- Sign Up

**Resources**
- Help Center (or /help)
- Blog (optional, skip for MVP)
- Changelog (optional)

**Legal**
- Privacy Policy
- Terms of Service
- Cookie Policy (if needed)

**Bottom:**
- © 2026 BillMint. All rights reserved.
- "Made in Romania" with flag (builds trust, shows there's a real person)

---

## Design Guidelines

### Colors

| Element | Color | Hex |
|---------|-------|-----|
| Primary (buttons, accents) | Teal | #14B8A6 |
| Primary hover | Teal dark | #0D9488 |
| Text primary | Slate 900 | #0F172A |
| Text secondary | Slate 600 | #475569 |
| Background | White | #FFFFFF |
| Background alt | Slate 50 | #F8FAFC |
| Border | Slate 200 | #E2E8F0 |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Hero headline | System/Inter | 48-64px | 700 |
| Section headline | System/Inter | 32-40px | 600 |
| Body text | System/Inter | 16-18px | 400 |
| Small text | System/Inter | 14px | 400 |
| Button text | System/Inter | 16px | 500 |

### Spacing

- Section padding: 80-120px vertical
- Max content width: 1200px
- Card padding: 24-32px
- Button padding: 12px 24px

### Visual Style

- Clean, minimal, lots of whitespace
- Subtle shadows (shadow-sm, shadow-md)
- Rounded corners (8-12px)
- No heavy gradients or textures
- Screenshots with subtle browser chrome or device frames
- Icons: Lucide or similar line icons

---

## Mobile Considerations

- Hero: Stack headline, buttons, screenshot vertically
- Features: Single column, cards stack
- Pricing: Cards stack or horizontal scroll
- FAQ: Full width accordion
- Navigation: Hamburger menu
- CTAs: Full-width buttons on mobile
- Font sizes: Reduce headlines by ~20%

---

## SEO & Meta

### Title Tag
`BillMint - Simple Time Tracking & Invoicing for Freelancers`

### Meta Description
`Track time, create invoices, and get paid faster. Simple time tracking and invoicing for freelancers and small teams. Start free.`

### Open Graph

```html
<meta property="og:title" content="BillMint - Simple Time Tracking & Invoicing">
<meta property="og:description" content="Track time, create invoices, and get paid faster. Start free.">
<meta property="og:image" content="https://billmint.io/og-image.png">
<meta property="og:url" content="https://billmint.io">
```

### Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "BillMint",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "50"
  }
}
```

---

## Conversion Optimizations

### Trust Signals
- "No credit card required" under every CTA
- Money-back guarantee mention
- Secure payment badges (when applicable)
- Real testimonials with names/photos
- "Made in Romania" (real person behind it)

### Urgency/Scarcity (use sparingly)
- "Join 500+ freelancers" (social proof, not fake urgency)
- Avoid countdown timers or fake limited offers

### Reduce Friction
- Single CTA action: "Start Free" everywhere
- No pricing page—pricing visible on landing page
- Email-only signup (no password on first step)
- Show the product (screenshots, video) early

### Exit Intent (Optional)
- Popup when mouse moves to close tab
- "Wait! Start your free timer before you go"
- Email capture for browser extension waitlist

---

## A/B Testing Ideas (Post-Launch)

1. Headline variations: "Track time. Get paid." vs "Stop losing billable hours"
2. CTA text: "Start Free" vs "Try It Free" vs "Get Started"
3. Hero visual: Screenshot vs Video vs Animated GIF
4. Social proof: With vs without testimonials
5. Pricing display: 3 columns vs comparison table

---

## Launch Checklist

- [ ] All sections implemented
- [ ] Mobile responsive
- [ ] All links work
- [ ] Meta tags set
- [ ] OG image created
- [ ] Favicon set
- [ ] Analytics installed (Plausible/PostHog)
- [ ] Forms connected (signup flow)
- [ ] Page speed optimized (<3s load)
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on iOS and Android

---

## Copy Bank (Alternative Headlines)

**Hero headlines:**
- Track time. Send invoices. Get paid.
- Stop guessing. Start tracking.
- Your time is money. Track it.
- Freelance time tracking that doesn't suck.
- Time tracking and invoicing in one place.

**Subheadlines:**
- The simplest way to track hours and bill clients.
- No bloat. No learning curve. Just track and invoice.
- Built for freelancers who hate timesheets.
- Spend less time on admin, more time on work.

**CTAs:**
- Start Free
- Try It Free
- Get Started Free
- Start Tracking
- Create Free Account
