"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              An error occurred while loading this page. Please try again.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={reset}>
              <RefreshCw className="mr-2 size-4" />
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
