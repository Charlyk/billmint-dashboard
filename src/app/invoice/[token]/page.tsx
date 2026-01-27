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
    async function fetchInvoice() {
      try {
        const invoiceData = await getPublicInvoice(token);
        setData(invoiceData);
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
        setError("Invoice not found or has expired.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoice();
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
          <CardContent className="p-8 sm:p-12">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {user.company_name || user.full_name || "Invoice"}
                </h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
            </div>

            {/* From / To */}
            <div className="mb-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  From:
                </p>
                <p className="font-medium">
                  {user.company_name || user.full_name || "Your Business"}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Bill To:
                </p>
                <p className="font-medium">{invoice.client.name}</p>
                {invoice.client.email && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.client.email}
                  </p>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="mb-8 space-y-1">
              <p>
                <span className="text-muted-foreground">Invoice:</span>{" "}
                <span className="font-mono font-medium">
                  {invoice.invoice_number}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Issue Date:</span>{" "}
                {formatDate(invoice.issue_date)}
              </p>
              <p>
                <span className="text-muted-foreground">Due Date:</span>{" "}
                {formatDate(invoice.due_date)}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    invoice.status === "paid"
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                      : invoice.status === "overdue"
                        ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                  }`}
                >
                  {invoice.status.toUpperCase()}
                </span>
              </p>
            </div>

            {/* Line Items Table */}
            <div className="mb-8 overflow-hidden rounded-lg border">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_60px_80px_100px] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
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
                    className="grid grid-cols-[1fr_60px_80px_100px] gap-4 px-4 py-3 text-sm"
                  >
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
                ))}
              </div>

              {/* Totals */}
              <div className="border-t bg-muted/30">
                <div className="grid grid-cols-[1fr_100px] gap-4 px-4 py-2 text-sm">
                  <span className="text-right text-muted-foreground">
                    Subtotal:
                  </span>
                  <span className="text-right tabular-nums">
                    {formatCurrency(invoice.subtotal, invoice.currency, invoice.currency)}
                  </span>
                </div>

                {invoice.tax_rate > 0 && invoice.tax_amount > 0 && (
                  <div className="grid grid-cols-[1fr_100px] gap-4 px-4 py-2 text-sm">
                    <span className="text-right text-muted-foreground">
                      Tax ({invoice.tax_rate}%):
                    </span>
                    <span className="text-right tabular-nums">
                      {formatCurrency(invoice.tax_amount, invoice.currency, invoice.currency)}
                    </span>
                  </div>
                )}

                {invoice.discount_amount > 0 && (
                  <div className="grid grid-cols-[1fr_100px] gap-4 px-4 py-2 text-sm">
                    <span className="text-right text-muted-foreground">
                      Discount:
                    </span>
                    <span className="text-right tabular-nums">
                      -{formatCurrency(invoice.discount_amount, invoice.currency, invoice.currency)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-[1fr_100px] gap-4 border-t px-4 py-3 font-medium">
                  <span className="text-right">Total Due:</span>
                  <span className="text-right tabular-nums">
                    {formatCurrency(invoice.total, invoice.currency, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Notes:
                </p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}

            {/* Terms */}
            {invoice.terms && (
              <div className="mb-8">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Terms:
                </p>
                <p className="text-sm">{invoice.terms}</p>
              </div>
            )}

            {/* Download Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
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
            <span className="font-medium text-teal-600">BillMint.io</span>
          </p>
        </div>
      </div>
    </div>
  );
}
