import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "BillMint terms of service. Read our terms for using the time tracking and invoicing platform.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
