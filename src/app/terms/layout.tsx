import type { Metadata } from "next";

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

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
