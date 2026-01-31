"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console in development
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-teal-500">BillMint.io</h1>
        <p className="mt-2 text-muted-foreground">
          Track time. Send invoices. Get paid.
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error occurred. Please try again or contact support
              if the problem persists.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={reset}>
              Try again
            </Button>
            <Button render={<Link href="/dashboard" />} className="bg-teal-500 hover:!bg-teal-600 border-teal-500">
              Go to Dashboard
            </Button>
          </div>
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
