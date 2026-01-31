"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { resetPassword } from "@/lib/api/auth";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
    } catch (error) {
      console.error("Reset password error:", error);
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-teal-500">BillMint.io</h1>
        <p className="mt-2 text-muted-foreground">Track time. Send invoices. Get paid.</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <h2 className="text-xl font-semibold">Reset password</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {isSubmitted ? (
            <div className="text-center">
              <p className="text-muted-foreground">
                If an account exists with that email, we&apos;ve sent you a password reset link.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block font-medium text-teal-500 hover:text-teal-600"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </Field>

                <Button
                  type="submit"
                  className="w-full bg-teal-500 hover:!bg-teal-600 border-teal-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 size-4" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-medium text-teal-500 hover:text-teal-600"
                >
                  Sign in
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
