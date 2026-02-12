import type { Metadata } from "next";

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

export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
