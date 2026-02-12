import type { Metadata } from "next";

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

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
