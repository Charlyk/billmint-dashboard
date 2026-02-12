import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your BillMint account to track time and manage invoices.",
  robots: {
    index: false,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
