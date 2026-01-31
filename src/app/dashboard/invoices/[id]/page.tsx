"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Send, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { useInvoice, useInvoiceMutations } from "@/lib/hooks";
import { useUserSettings, useTimezone } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { useState } from "react";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700" },
  paid: { label: "Paid", className: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", className: "bg-red-100 text-red-700" },
  void: { label: "Void", className: "bg-gray-100 text-gray-500" },
};

function formatDate(dateString: string, timezone: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  });
}

export default function ViewInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { settings } = useUserSettings();
  const timezone = useTimezone();
  const { invoice, isLoading, mutate } = useInvoice(id);
  const { sendReminder, markAsPaid } = useInvoiceMutations();
  const [isActionLoading, setIsActionLoading] = useState(false);

  const displayCurrency = settings?.default_currency || "USD";

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!response.ok) throw new Error("Failed to download PDF");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toastManager.add({
        type: "error",
        title: "Failed to download PDF",
      });
    }
  };

  const handleSendReminder = async () => {
    if (!invoice) return;
    setIsActionLoading(true);
    try {
      await sendReminder(invoice.id);
      toastManager.add({
        type: "success",
        title: "Reminder sent",
      });
    } catch {
      toastManager.add({
        type: "error",
        title: "Failed to send reminder",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    setIsActionLoading(true);
    try {
      await markAsPaid(invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice marked as paid",
      });
      mutate();
    } catch {
      toastManager.add({
        type: "error",
        title: "Failed to mark as paid",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Invoices
        </Link>
        <div className="py-12 text-center text-muted-foreground">
          Invoice not found
        </div>
      </div>
    );
  }

  const subtotal = invoice.line_items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * ((invoice.tax_rate || 0) / 100);
  const total = subtotal + taxAmount - (invoice.discount_amount || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Invoices
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 size-4" />
            Download PDF
          </Button>
          {(invoice.status === "sent" || invoice.status === "overdue") && (
            <>
              <Button variant="outline" onClick={handleSendReminder} disabled={isActionLoading}>
                {isActionLoading ? <Spinner className="mr-2 size-4" /> : <Send className="mr-2 size-4" />}
                Send Reminder
              </Button>
              <Button
                onClick={handleMarkAsPaid}
                className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
                disabled={isActionLoading}
              >
                {isActionLoading ? <Spinner className="mr-2 size-4" /> : <CheckCircle className="mr-2 size-4" />}
                Mark as Paid
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-mono">{invoice.invoice_number}</h1>
          <p className="mt-1 text-muted-foreground">{invoice.client?.name}</p>
        </div>
        <span
          className={cn(
            "rounded px-3 py-1 text-sm font-medium",
            statusConfig[invoice.status as InvoiceStatus]?.className
          )}
        >
          {statusConfig[invoice.status as InvoiceStatus]?.label || invoice.status}
        </span>
      </div>

      {/* Invoice Details */}
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-muted-foreground">Issue Date</p>
            <p className="font-medium">{formatDate(invoice.issue_date, timezone)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{formatDate(invoice.due_date, timezone)}</p>
          </div>
          {invoice.paid_date && (
            <div>
              <p className="text-sm text-muted-foreground">Paid Date</p>
              <p className="font-medium">{formatDate(invoice.paid_date, timezone)}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Client Email</p>
            <p className="font-medium">{invoice.client?.email || "No email"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h2 className="font-medium">Line Items</h2>
          </div>
          <div className="hidden border-b px-4 py-3 lg:grid lg:grid-cols-[1fr_80px_100px_120px] lg:gap-4">
            <span className="text-sm font-medium text-muted-foreground">Description</span>
            <span className="text-sm font-medium text-muted-foreground text-right">Qty</span>
            <span className="text-sm font-medium text-muted-foreground text-right">Rate</span>
            <span className="text-sm font-medium text-muted-foreground text-right">Amount</span>
          </div>
          <div className="divide-y">
            {invoice.line_items.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 p-4 lg:grid-cols-[1fr_80px_100px_120px] lg:gap-4 lg:items-center"
              >
                <div>
                  <p className="font-medium">{item.description}</p>
                </div>
                <p className="text-sm lg:text-right tabular-nums">{item.quantity.toFixed(2)}h</p>
                <p className="text-sm lg:text-right tabular-nums">
                  {formatCurrency(item.unit_price, invoice.currency, displayCurrency)}
                </p>
                <p className="font-medium lg:text-right tabular-nums">
                  {formatCurrency(item.amount, invoice.currency, displayCurrency)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="tabular-nums">{formatCurrency(subtotal, invoice.currency, displayCurrency)}</span>
          </div>
          {(invoice.tax_rate || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({invoice.tax_rate}%):</span>
              <span className="tabular-nums">{formatCurrency(taxAmount, invoice.currency, displayCurrency)}</span>
            </div>
          )}
          {(invoice.discount_amount || 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount:</span>
              <span className="tabular-nums text-green-600">
                -{formatCurrency(invoice.discount_amount || 0, invoice.currency, displayCurrency)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-medium text-lg">
            <span>Total:</span>
            <span className="tabular-nums">{formatCurrency(total, invoice.currency, displayCurrency)}</span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {invoice.notes && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
          {invoice.terms && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Terms</h3>
                <p className="text-sm whitespace-pre-wrap">{invoice.terms}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
