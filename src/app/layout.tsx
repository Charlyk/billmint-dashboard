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
    "Track time, create invoices, and get paid faster. Simple time tracking and invoicing for freelancers and small teams. Start free.",
  keywords: [
    "time tracking",
    "invoicing",
    "freelancer",
    "invoice generator",
    "time tracker",
    "billing",
    "freelance tools",
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
