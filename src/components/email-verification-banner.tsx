"use client";

import { useState } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { resendVerificationEmail } from "@/lib/api/auth";

export function EmailVerificationBanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    setFeedback(null);

    try {
      const result = await resendVerificationEmail();
      setFeedback({
        type: result.success ? "success" : "error",
        message: result.message,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to send verification email",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Mail className="size-4 text-amber-600 dark:text-amber-500 shrink-0" />
        <span className="text-amber-800 dark:text-amber-200 truncate">
          {feedback ? (
            <span
              className={
                feedback.type === "success"
                  ? "text-teal-700 dark:text-teal-400"
                  : "text-red-700 dark:text-red-400"
              }
            >
              {feedback.message}
            </span>
          ) : (
            "Please verify your email address to get the most out of BillMint."
          )}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {!feedback?.type && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={isLoading}
            className="h-7 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-1.5 size-3" />
                Sending...
              </>
            ) : (
              "Resend email"
            )}
          </Button>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
