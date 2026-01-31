"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import { getPublicInvoice } from "@/lib/api/invoices";
import { formatCurrency } from "@/lib/utils/currency";
import type { PublicInvoiceResponse } from "@/types";
import { use } from "react";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function InvoicePublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<PublicInvoiceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchInvoice() {
      try {
        const invoiceData = await getPublicInvoice(token);
        if (!abortController.signal.aborted) {
          setData(invoiceData);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("Failed to fetch invoice:", err);
          setError("Invoice not found or has expired.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    fetchInvoice();

    return () => {
      abortController.abort();
    };
  }, [token]);

  const handleDownloadPDF = async () => {
    if (!data) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/invoices/public/${token}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4">
          <Card className="overflow-hidden">
            <CardContent className="flex items-center justify-center p-12">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4">
          <Card className="overflow-hidden">
            <CardContent className="p-12 text-center">
              <h1 className="text-2xl font-semibold text-muted-foreground">
                {error || "Invoice not found"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                This invoice may have been deleted or the link is invalid.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { invoice, user } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-8 md:p-12">
            {/* Header */}
            <div className="mb-6 flex justify-end sm:mb-8">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">INVOICE</h1>
            </div>

            {/* From / To */}
            <div className="mb-6 grid gap-6 sm:mb-8 sm:grid-cols-2 sm:gap-8">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2">
                  From
                </p>
                <p className="font-semibold">
                  {user.company_name || user.full_name || "Your Business"}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2">
                  Bill To
                </p>
                <p className="font-semibold">{invoice.client.name}</p>
                {invoice.client.email && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.client.email}
                  </p>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="mb-6 space-y-1 text-sm sm:mb-8 sm:text-base">
              <div className="flex flex-wrap gap-x-2">
                <span className="w-20 shrink-0 text-muted-foreground sm:w-24">Invoice #:</span>
                <span className="font-semibold">{invoice.invoice_number}</span>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <span className="w-20 shrink-0 text-muted-foreground sm:w-24">Issue Date:</span>
                <span className="font-semibold">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <span className="w-20 shrink-0 text-muted-foreground sm:w-24">Due Date:</span>
                <span className="font-semibold">{formatDate(invoice.due_date)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="w-20 shrink-0 text-muted-foreground sm:w-24">Status:</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${
                    invoice.status === "paid"
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : invoice.status === "overdue"
                        ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-6 overflow-hidden rounded-lg border sm:mb-8">
              {/* Table Header - Hidden on mobile */}
              <div className="hidden border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_60px_80px_100px] sm:gap-4">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>

              {/* Table Body */}
              <div className="divide-y">
                {invoice.line_items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 text-sm"
                  >
                    {/* Mobile layout - stacked */}
                    <div className="sm:hidden">
                      <p className="font-medium">{item.description}</p>
                      <div className="mt-2 flex justify-between text-muted-foreground">
                        <span>{item.quantity} × {formatCurrency(item.unit_price, invoice.currency, invoice.currency)}</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {formatCurrency(item.amount, invoice.currency, invoice.currency)}
                        </span>
                      </div>
                    </div>
                    {/* Desktop layout - table row */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_60px_80px_100px] sm:gap-4">
                      <span>{item.description}</span>
                      <span className="text-right tabular-nums">
                        {item.quantity}
                      </span>
                      <span className="text-right tabular-nums">
                        {formatCurrency(item.unit_price, invoice.currency, invoice.currency)}
                      </span>
                      <span className="text-right font-medium tabular-nums">
                        {formatCurrency(item.amount, invoice.currency, invoice.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t bg-muted/30">
                <div className="flex justify-between px-4 py-2 text-sm sm:grid sm:grid-cols-[1fr_100px] sm:gap-4">
                  <span className="text-muted-foreground sm:text-right">
                    Subtotal:
                  </span>
                  <span className="tabular-nums sm:text-right">
                    {formatCurrency(invoice.subtotal, invoice.currency, invoice.currency)}
                  </span>
                </div>

                {invoice.tax_rate > 0 && invoice.tax_amount > 0 && (
                  <div className="flex justify-between px-4 py-2 text-sm sm:grid sm:grid-cols-[1fr_100px] sm:gap-4">
                    <span className="text-muted-foreground sm:text-right">
                      Tax ({invoice.tax_rate}%):
                    </span>
                    <span className="tabular-nums sm:text-right">
                      {formatCurrency(invoice.tax_amount, invoice.currency, invoice.currency)}
                    </span>
                  </div>
                )}

                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between px-4 py-2 text-sm sm:grid sm:grid-cols-[1fr_100px] sm:gap-4">
                    <span className="text-muted-foreground sm:text-right">
                      Discount:
                    </span>
                    <span className="tabular-nums sm:text-right">
                      -{formatCurrency(invoice.discount_amount, invoice.currency, invoice.currency)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-t px-4 py-3 font-semibold sm:grid sm:grid-cols-[1fr_100px] sm:gap-4">
                  <span className="sm:text-right">Total:</span>
                  <span className="tabular-nums sm:text-right">
                    {formatCurrency(invoice.total, invoice.currency, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="mb-6 space-y-4 sm:mb-8">
                {invoice.notes && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2">
                      Notes
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:mb-2">
                      Terms
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p>
                  </div>
                )}
              </div>
            )}

            {/* Download Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="w-full sm:w-auto"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 size-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://billmint.io"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-teal-600 hover:text-teal-700 hover:underline"
            >
              BillMint.io
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
