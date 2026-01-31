import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
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
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="size-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Page not found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" render={<Link href="/" />}>
              Go home
            </Button>
            <Button render={<Link href="/dashboard" />} className="bg-teal-500 hover:!bg-teal-600 border-teal-500">
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
