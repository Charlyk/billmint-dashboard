"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, XCircle } from "lucide-react";
import { verifyEmail } from "@/lib/api/auth";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  // Initialize state based on whether token exists
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "" : "Invalid verification link. No token provided."
  );

  useEffect(() => {
    // Only proceed if we have a token and are in loading state
    if (!token || status !== "loading") {
      return;
    }

    let isCancelled = false;

    verifyEmail(token)
      .then((result) => {
        if (isCancelled) return;
        if (result.success) {
          setStatus("success");
          setMessage(result.message);
        } else {
          setStatus("error");
          setMessage(result.message);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setStatus("error");
        setMessage(
          err instanceof Error ? err.message : "Failed to verify email"
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [token, status]);

  // Separate effect for redirect after success
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-teal-500">BillMint.io</h1>
        <p className="mt-2 text-muted-foreground">
          Track time. Send invoices. Get paid.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h2 className="text-xl font-semibold">Email Verification</h2>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          {status === "loading" && (
            <>
              <Spinner className="size-8 text-teal-500" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="size-12 text-teal-500" />
              <div className="text-center">
                <p className="font-medium text-foreground">{message}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
              <Link
                href="/dashboard"
                className="mt-2 font-medium text-teal-500 hover:text-teal-600"
              >
                Go to Dashboard
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="size-12 text-destructive" />
              <div className="text-center">
                <p className="font-medium text-foreground">{message}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  If you need a new verification email, please log in and
                  request one from your dashboard.
                </p>
              </div>
              <Link
                href="/login"
                className="mt-2 font-medium text-teal-500 hover:text-teal-600"
              >
                Go to Login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-teal-500">BillMint.io</h1>
            <p className="mt-2 text-muted-foreground">
              Track time. Send invoices. Get paid.
            </p>
          </div>
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <h2 className="text-xl font-semibold">Email Verification</h2>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-8">
              <Spinner className="size-6 text-teal-500" />
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
