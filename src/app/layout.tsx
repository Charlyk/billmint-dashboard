import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/contexts/providers";
import { PHProvider } from "@/contexts/posthog-provider";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
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
  metadataBase: new URL("https://billmint.io"),
  title: {
    template: "%s | BillMint",
    default: "BillMint - Simple Time Tracking & Invoicing for Freelancers",
  },
  description:
    "BillMint is free time tracking software with invoicing built in. Track billable hours, create professional invoices, and get paid faster. The best time tracking and billing software for freelancers, consultants, and small teams.",
  keywords: [
    "time tracking software",
    "time tracking software app",
    "freelancer time tracking",
    "time tracking billing software",
    "time tracking software for billable hours",
    "time tracking and billing software for consultants",
    "time tracking software with invoicing",
    "freelance time tracking free",
    "invoicing software",
    "invoice generator",
    "freelance tools",
    "time tracker",
    "billing software",
    "best time tracking software",
    "time tracking software online",
    "task time tracking software",
    "freelancer time tracking software",
    "time tracking for freelance work",
    "time tracking software for projects",
    "free time tracking software",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "BillMint - Simple Time Tracking & Invoicing",
    description:
      "Free time tracking software with invoicing. Track billable hours, create invoices, and get paid faster. Built for freelancers and consultants.",
    url: "https://billmint.io",
    siteName: "BillMint",
    type: "website",
    images: [
      {
        url: "/billmint_og.png",
        width: 1200,
        height: 630,
        alt: "BillMint - Simple Time Tracking & Invoicing for Freelancers",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BillMint - Simple Time Tracking & Invoicing",
    description:
      "Free time tracking software with invoicing. Track billable hours, create invoices, and get paid faster. Built for freelancers and consultants.",
    images: ["/billmint_og.png"],
  },
};

// Script to prevent flash of wrong theme - runs before React hydrates
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PHProvider>
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <Providers>{children}</Providers>
        </PHProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
