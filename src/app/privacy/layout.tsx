import type { Metadata } from "next";

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

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
