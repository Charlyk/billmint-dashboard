"use client";

import { useEffect, useState } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [isDark, setIsDark] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- legitimate use for hydration safety */
  useEffect(() => {
    console.error("Global error:", error);
    // Check for dark mode preference
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(stored === "dark" || (!stored && prefersDark));
  }, [error]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const colors = isDark
    ? {
        bg: "#0a0a0a",
        text: "#fafafa",
        textMuted: "#a1a1aa",
        cardBg: "#18181b",
        cardBorder: "#27272a",
        iconBg: "rgba(239, 68, 68, 0.1)",
        teal: "#14b8a6",
        red: "#ef4444",
      }
    : {
        bg: "#fafafa",
        text: "#0a0a0a",
        textMuted: "#71717a",
        cardBg: "#ffffff",
        cardBorder: "#e4e4e7",
        iconBg: "#fef2f2",
        teal: "#14b8a6",
        red: "#ef4444",
      };

  return (
    <html>
      <body style={{ margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, -apple-system, sans-serif",
            backgroundColor: colors.bg,
            color: colors.text,
          }}
        >
          <div style={{ marginBottom: "2rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: colors.teal, margin: 0 }}>
              BillMint.io
            </h1>
            <p style={{ marginTop: "0.5rem", color: colors.textMuted }}>
              Track time. Send invoices. Get paid.
            </p>
          </div>

          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              padding: "1.5rem",
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.cardBorder}`,
              borderRadius: "0.75rem",
              textAlign: "center",
              boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                width: "4rem",
                height: "4rem",
                margin: "0 auto 1rem",
                borderRadius: "50%",
                backgroundColor: colors.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                style={{ width: "2rem", height: "2rem", color: colors.red }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: colors.text }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "0.875rem", color: colors.textMuted, marginBottom: "1.5rem" }}>
              A critical error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: colors.teal,
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                cursor: "pointer",
                fontWeight: "500",
                fontSize: "0.875rem",
              }}
            >
              Try again
            </button>
            {error.digest && (
              <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: colors.textMuted }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
