import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  DollarSign,
  FileText,
  Globe,
  Check,
  ChevronRight,
  Star,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/ui/accordion";
import { LandingHeader } from "@/components/landing-header";
import { DemoPreview } from "@/components/demo-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import type { User } from "@/types";

interface LandingPageProps {
  user: User | null;
}

export function LandingPage({ user }: LandingPageProps) {
  // JSON-LD Structured Data
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BillMint",
    "url": "https://billmint.io",
    "logo": "https://billmint.io/billmint_logo_wbg.webp",
    "description": "Simple time tracking and invoicing for freelancers and small teams.",
  };

  const softwareApplicationSchema = {
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
        "description": "Unlimited time tracking, 1 user, basic reports",
      },
      {
        "@type": "Offer",
        "price": "5.00",
        "priceCurrency": "USD",
        "name": "Pro",
        "description": "Unlimited invoices, clients, projects, PDF export, full reports",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "billingDuration": "P1M",
        },
      },
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "50",
      "bestRating": "5",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is there really a free plan?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Track unlimited time, forever free. You only pay when you need invoicing, clients, projects, and advanced features.",
        },
      },
      {
        "@type": "Question",
        "name": "Can I import my data from Toggl or Harvest?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Not yet, but it's on our roadmap. For now, you can start fresh or manually add past entries.",
        },
      },
      {
        "@type": "Question",
        "name": "How does the browser extension work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Install the extension, and you'll see a timer button in Asana, Jira, and Trello. Click to track time—it syncs automatically to BillMint. (Coming soon)",
        },
      },
      {
        "@type": "Question",
        "name": "Is my data secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. We use industry-standard encryption, secure hosting on Vercel, and never share your data with third parties.",
        },
      },
      {
        "@type": "Question",
        "name": "Can I cancel anytime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. No contracts, no cancellation fees. Cancel from your settings in one click.",
        },
      },
      {
        "@type": "Question",
        "name": "Do you offer refunds?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. If you're not happy within the first 14 days, we'll refund you—no questions asked.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header - Client Component */}
      <LandingHeader user={user} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-teal-50/50 to-transparent dark:from-teal-950/20" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Track time. Send invoices.
              <br />
              <span className="text-teal-500">Get paid.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Simple time tracking and invoicing for freelancers and small
              teams. Start free, upgrade when you&apos;re ready.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="xl"
                render={<Link href="/signup" />}
                className="w-full sm:w-auto bg-teal-500 hover:bg-teal-600 border-teal-500"
              >
                Start Free
              </Button>
              <Button
                size="xl"
                variant="outline"
                render={<a href="#how-it-works" />}
                className="w-full sm:w-auto"
              >
                See How It Works
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required
            </p>
          </div>

          {/* App Screenshot */}
          <div className="mt-16 sm:mt-20">
            <div className="relative mx-auto max-w-4xl">
              <div className="rounded-2xl border bg-card p-2 shadow-2xl">
                <DemoPreview />
              </div>
              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 size-24 rounded-full bg-teal-500/10 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 size-32 rounded-full bg-teal-500/10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y bg-muted/30 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="size-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="text-sm font-medium">4.9/5 rating</span>
            </div>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <p className="text-sm text-muted-foreground">
              Built for freelancers, by a freelancer
            </p>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Tired of complicated tools?
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {/* Problem */}
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600 dark:text-red-400">
                <X className="size-5" />
                The Problem
              </h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                  Harvest costs $12/user/month
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                  Toggl needs 10 clicks to send an invoice
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                  Features you&apos;ll never use
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                  Timers that forget your work
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-6 dark:border-teal-900/50 dark:bg-teal-950/20">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-teal-600 dark:text-teal-400">
                <Check className="size-5" />
                The Solution
              </h3>
              <ul className="mt-4 space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-400" />
                  BillMint is $5 + $1/user
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-400" />
                  One-click invoice from tracked time
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-400" />
                  Only what you need, nothing more
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-teal-400" />
                  Auto-save, never lose a minute
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Everything you need. Nothing you don&apos;t.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Feature 1: Timer */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex size-12 items-center justify-center rounded-xl bg-teal-500/10">
                <Clock className="size-6 text-teal-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">One-Click Timer</h3>
              <p className="mt-2 text-muted-foreground">
                Start tracking in one click. Add details later. Auto-saves so
                you never lose a minute, even if you forget to stop.
              </p>
              <a
                href="#how-it-works"
                className="mt-4 inline-flex items-center text-sm font-medium text-teal-500 hover:text-teal-600"
              >
                See timer in action
                <ChevronRight className="ml-1 size-4" />
              </a>
            </div>

            {/* Feature 2: Invoicing */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex size-12 items-center justify-center rounded-xl bg-teal-500/10">
                <FileText className="size-6 text-teal-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Instant Invoicing</h3>
              <p className="mt-2 text-muted-foreground">
                Turn tracked time into professional invoices in seconds. Add
                your logo, send to clients, get paid faster.
              </p>
              <a
                href="#how-it-works"
                className="mt-4 inline-flex items-center text-sm font-medium text-teal-500 hover:text-teal-600"
              >
                See sample invoice
                <ChevronRight className="ml-1 size-4" />
              </a>
            </div>

            {/* Feature 3: Extension */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex size-12 items-center justify-center rounded-xl bg-teal-500/10">
                <Globe className="size-6 text-teal-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Track Where You Work</h3>
              <p className="mt-2 text-muted-foreground">
                Track time directly in Asana, Jira, and Trello. No tab
                switching, no copy-pasting. Coming soon.
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-medium text-muted-foreground">
                Coming soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Get paid in 3 steps
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-500/10 text-2xl font-bold text-teal-500">
                1
              </div>
              <div className="mt-6 flex size-20 mx-auto items-center justify-center rounded-2xl bg-muted">
                <Clock className="size-10 text-teal-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Track Time</h3>
              <p className="mt-2 text-muted-foreground">
                Start the timer when you work. Stop when done. Add project and
                notes anytime.
              </p>
              <div className="absolute right-0 top-8 hidden h-0.5 w-full bg-gradient-to-r from-transparent via-teal-500/30 to-transparent md:block" />
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-500/10 text-2xl font-bold text-teal-500">
                2
              </div>
              <div className="mt-6 flex size-20 mx-auto items-center justify-center rounded-2xl bg-muted">
                <FileText className="size-10 text-teal-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Create Invoice</h3>
              <p className="mt-2 text-muted-foreground">
                Select unbilled hours. Click &quot;Create Invoice&quot;. Review,
                customize, send.
              </p>
              <div className="absolute right-0 top-8 hidden h-0.5 w-full bg-gradient-to-r from-transparent via-teal-500/30 to-transparent md:block" />
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-teal-500/10 text-2xl font-bold text-teal-500">
                3
              </div>
              <div className="mt-6 flex size-20 mx-auto items-center justify-center rounded-2xl bg-muted">
                <DollarSign className="size-10 text-teal-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Get Paid</h3>
              <p className="mt-2 text-muted-foreground">
                Share invoice link with client. Track when it&apos;s viewed and
                paid.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Button
              size="xl"
              render={<Link href="/signup" />}
              className="bg-teal-500 hover:bg-teal-600 border-teal-500"
            >
              Start Free
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="scroll-mt-20 bg-muted/30 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              No hidden fees. No per-seat surprises. Cancel anytime.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Free Plan */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Free</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground"> forever</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Unlimited time tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>1 user</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Basic reports</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="mt-6 w-full"
                render={<Link href="/signup" />}
              >
                Start Free
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-2xl border-2 border-teal-500 bg-card p-6 shadow-sm">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-xs font-semibold text-white">
                Popular
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-muted-foreground"> /month</span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Unlimited invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Unlimited clients & projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>PDF export</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Full reports</span>
                </li>
              </ul>
              <Button
                className="mt-6 w-full bg-teal-500 hover:bg-teal-600 border-teal-500"
                render={<Link href="/signup" />}
              >
                Start Free
              </Button>
            </div>

            {/* Team Plan */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Team</h3>
              <div className="mt-4">
                <span className="text-4xl font-bold">$5</span>
                <span className="text-muted-foreground">
                  {" "}
                  + $1/user/month
                </span>
              </div>
              <ul className="mt-6 space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Up to 30 team members</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-5 text-teal-500" />
                  <span>Team reports</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="size-5" />
                  <span>Coming soon</span>
                </li>
              </ul>
              <Button
                variant="outline"
                className="mt-6 w-full"
                render={<Link href="/signup" />}
              >
                Start Free
              </Button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Compare: Harvest $12/user &bull; Toggl $10/user
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Loved by freelancers
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Featured Testimonial */}
            <div className="md:col-span-3 rounded-2xl border bg-card p-8 shadow-sm">
              <blockquote className="text-lg sm:text-xl text-center max-w-3xl mx-auto">
                &quot;Finally, a time tracker that doesn&apos;t try to be
                everything. I track time, I invoice, I get paid. That&apos;s it.
                That&apos;s all I needed.&quot;
              </blockquote>
              <div className="mt-6 text-center">
                <p className="font-semibold">Sarah K.</p>
                <p className="text-sm text-muted-foreground">
                  Freelance Designer
                </p>
              </div>
            </div>

            {/* Smaller Testimonials */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <blockquote className="text-muted-foreground">
                &quot;Switched from Harvest. Saving $80/month.&quot;
              </blockquote>
              <div className="mt-4">
                <p className="font-semibold">Mike R.</p>
                <p className="text-sm text-muted-foreground">Agency Owner</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <blockquote className="text-muted-foreground">
                &quot;The invoicing alone is worth the price.&quot;
              </blockquote>
              <div className="mt-4">
                <p className="font-semibold">Ana T.</p>
                <p className="text-sm text-muted-foreground">Consultant</p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <blockquote className="text-muted-foreground">
                &quot;Simple, fast, and just works. Exactly what I needed.&quot;
              </blockquote>
              <div className="mt-4">
                <p className="font-semibold">David L.</p>
                <p className="text-sm text-muted-foreground">
                  Freelance Developer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Frequently Asked Questions
          </h2>

          <Accordion className="mt-12">
            <AccordionItem value="free">
              <AccordionTrigger>Is there really a free plan?</AccordionTrigger>
              <AccordionPanel>
                Yes. Track unlimited time, forever free. You only pay when you
                need invoicing, clients, projects, and advanced features.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="import">
              <AccordionTrigger>
                Can I import my data from Toggl or Harvest?
              </AccordionTrigger>
              <AccordionPanel>
                Not yet, but it&apos;s on our roadmap. For now, you can start
                fresh or manually add past entries.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="extension">
              <AccordionTrigger>
                How does the browser extension work?
              </AccordionTrigger>
              <AccordionPanel>
                Install the extension, and you&apos;ll see a timer button in
                Asana, Jira, and Trello. Click to track time—it syncs
                automatically to BillMint. (Coming soon)
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="security">
              <AccordionTrigger>Is my data secure?</AccordionTrigger>
              <AccordionPanel>
                Yes. We use industry-standard encryption, secure hosting on
                Vercel, and never share your data with third parties.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="cancel">
              <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
              <AccordionPanel>
                Absolutely. No contracts, no cancellation fees. Cancel from your
                settings in one click.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem value="refund">
              <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
              <AccordionPanel>
                Yes. If you&apos;re not happy within the first 14 days,
                we&apos;ll refund you—no questions asked.
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-teal-50/50 to-transparent dark:from-teal-950/20" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to get paid for your time?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start tracking in seconds. No credit card needed.
          </p>
          <Button
            size="xl"
            render={<Link href="/signup" />}
            className="mt-8 bg-teal-500 hover:bg-teal-600 border-teal-500"
          >
            Start Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 md:col-span-1">
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-bold text-teal-500"
              >
                <Image
                  src="/billmint_logo.webp"
                  alt="BillMint logo"
                  width={28}
                  height={28}
                  className="size-7"
                />
                BillMint
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">
                Simple time tracking and invoicing.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold">Product</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold">Resources</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="/help-center"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Changelog
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold">Legal</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 BillMint. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <p className="text-sm text-muted-foreground">Made in Romania</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
