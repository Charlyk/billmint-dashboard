import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/contexts/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BillMint - Simple Time Tracking & Invoicing for Freelancers",
  description:
    "Track time, create invoices, and get paid faster. Simple time tracking and invoicing for freelancers and small teams. Start free.",
  openGraph: {
    title: "BillMint - Simple Time Tracking & Invoicing",
    description:
      "Track time, create invoices, and get paid faster. Start free.",
    url: "https://billmint.io",
    siteName: "BillMint",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BillMint - Simple Time Tracking & Invoicing",
    description:
      "Track time, create invoices, and get paid faster. Start free.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
