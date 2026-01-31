"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { updatePasswordWithToken } from "@/lib/api/auth";

export default function UpdatePasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!token) {
      setError("Invalid reset link");
      return;
    }

    setIsLoading(true);

    try {
      await updatePasswordWithToken(token, password);
      setIsSuccess(true);
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update password. The link may have expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2 className="text-xl font-semibold">Set new password</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {isSuccess ? (
            <div className="text-center">
              <p className="text-muted-foreground">
                Your password has been updated successfully. Redirecting to
                sign in...
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block font-medium text-teal-500 hover:text-teal-600"
              >
                Sign in now
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <p className="text-destructive">{error}</p>
              <Link
                href="/reset-password"
                className="mt-4 inline-block font-medium text-teal-500 hover:text-teal-600"
              >
                Request new reset link
              </Link>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field>
                  <FieldLabel>New Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                </Field>

                <Field>
                  <FieldLabel>Confirm Password</FieldLabel>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  {error && <FieldError>{error}</FieldError>}
                </Field>

                <Button
                  type="submit"
                  className="w-full bg-teal-500 hover:!bg-teal-600 border-teal-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
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
