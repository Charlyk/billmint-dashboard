import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Get help with BillMint. Find answers to common questions about time tracking, invoicing, and account management.",
};

export default function HelpCenterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
