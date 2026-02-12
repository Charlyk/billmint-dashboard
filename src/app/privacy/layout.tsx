import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how BillMint protects your data. Our privacy policy covers data collection, usage, and your rights.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
