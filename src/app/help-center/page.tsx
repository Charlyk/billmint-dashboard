import Link from "next/link";

const faqs = [
  {
    question: "How do I create my first invoice?",
    answer:
      'Navigate to the Dashboard, click "New Invoice", select a client, add your line items, and hit "Send". Your client will receive the invoice via email.',
  },
  {
    question: "How does time tracking work?",
    answer:
      "Start a timer from the Dashboard or manually log hours against a project. Tracked time can be converted into invoice line items automatically.",
  },
  {
    question: "Can I customize my invoice template?",
    answer:
      "Yes. Go to Settings > Invoice and you can upload your logo, adjust colors, and edit the footer text that appears on every invoice.",
  },
  {
    question: "How do I add a new client?",
    answer:
      'Go to the Clients page from the sidebar and click "Add Client". Fill in their name, email, and billing details. You can also create a client directly when drafting a new invoice.',
  },
  {
    question: "How do payments work?",
    answer:
      "BillMint handles subscription billing through Stripe. You can manage your subscription and view invoices from Settings > Billing. Client payment collection features are coming soon.",
  },
  {
    question: "Can I send recurring invoices?",
    answer:
      'Yes. When creating an invoice, enable the "Recurring" option and set the frequency (weekly, monthly, quarterly, or yearly). BillMint will automatically generate and send invoices on schedule.',
  },
  {
    question: "How do I export my data?",
    answer:
      "Go to Settings > Account and click \"Export Data\". You can download your clients, invoices, and time entries as CSV files.",
  },
  {
    question: "What currencies are supported?",
    answer:
      "BillMint currently supports major currencies including USD, EUR, GBP, and RON. You can set a default currency in Settings and override it per client or per invoice.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "Go to Settings > Billing and click \"Manage Subscription\". You can downgrade to the free plan at any time. Your data will be preserved.",
  },
];

const categories = [
  {
    title: "Getting Started",
    description: "Set up your account, add clients, and send your first invoice.",
    links: [
      { label: "Create your account", href: "#" },
      { label: "Add your first client", href: "#" },
      { label: "Send your first invoice", href: "#" },
    ],
  },
  {
    title: "Invoicing",
    description: "Create, customize, and manage invoices for your clients.",
    links: [
      { label: "Invoice templates", href: "#" },
      { label: "Recurring invoices", href: "#" },
      { label: "Payment reminders", href: "#" },
    ],
  },
  {
    title: "Time Tracking",
    description: "Track billable hours and convert them into invoices.",
    links: [
      { label: "Start a timer", href: "#" },
      { label: "Manual time entries", href: "#" },
      { label: "Generate time reports", href: "#" },
    ],
  },
  {
    title: "Account & Billing",
    description: "Manage your subscription, view invoices, and update your plan.",
    links: [
      { label: "Manage your subscription", href: "#" },
      { label: "View billing history", href: "#" },
      { label: "Update your plan", href: "#" },
    ],
  },
];

export default function HelpCenterPage() {
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

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        &larr; Back to home
      </Link>

      <h1 className="mt-8 text-4xl font-bold tracking-tight">Help Center</h1>
      <p className="mt-2 text-muted-foreground">
        Find answers to common questions and learn how to get the most out of
        BillMint.
      </p>

      {/* Categories */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {categories.map((category) => (
          <div
            key={category.title}
            className="rounded-lg border p-6"
          >
            <h2 className="text-lg font-semibold">{category.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {category.description}
            </p>
            <ul className="mt-4 space-y-2">
              {category.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">
          Frequently Asked Questions
        </h2>
        <div className="mt-8 space-y-8">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-semibold">{faq.question}</h3>
              <p className="mt-2 text-muted-foreground leading-7">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-16 rounded-lg border p-8 text-center">
        <h2 className="text-xl font-semibold">Still need help?</h2>
        <p className="mt-2 text-muted-foreground">
          Our support team is here to assist you.
        </p>
        <a
          href="mailto:support@billmint.com"
          className="mt-4 inline-block rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
}
