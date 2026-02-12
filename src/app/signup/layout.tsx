import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free",
  description: "Create your free BillMint account. Start tracking time and sending invoices in seconds.",
  openGraph: {
    title: "Sign Up Free | BillMint",
    description: "Create your free BillMint account. Start tracking time and sending invoices in seconds.",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
