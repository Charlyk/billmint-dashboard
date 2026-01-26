"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Menu,
  MenuTrigger,
  MenuPopup,
  MenuItem,
  MenuSeparator,
} from "@/components/ui/menu";
import {
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Download,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoices, useInvoiceMutations, useClients, useProjects } from "@/lib/hooks";
import { useUserSettings } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import type { InvoiceWithClient } from "@/types";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

const statusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "DRAFT",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  sent: {
    label: "SENT",
    className: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
  },
  paid: {
    label: "PAID",
    className: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
  },
  overdue: {
    label: "OVERDUE",
    className: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
  },
  void: {
    label: "VOID",
    className: "bg-slate-100 text-slate-400 line-through dark:bg-slate-800",
  },
};

// Currency to locale mapping for proper symbol placement
const currencyLocales: Record<string, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  CHF: "de-CH",
  JPY: "ja-JP",
  INR: "en-IN",
  BRL: "pt-BR",
  MXN: "es-MX",
  PLN: "pl-PL",
  RON: "ro-RO",
  SEK: "sv-SE",
  NOK: "nb-NO",
  DKK: "da-DK",
  NZD: "en-NZ",
  SGD: "en-SG",
  HKD: "zh-HK",
  ZAR: "en-ZA",
  AED: "ar-AE",
};

function formatCurrency(amount: number, currency: string = "USD"): string {
  const locale = currencyLocales[currency] || "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({
  title,
  amount,
  count,
  currency,
  isLoading,
}: {
  title: string;
  amount: number;
  count: number;
  currency: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        {isLoading ? (
          <div className="mt-1 h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <>
            <p className="mt-1 text-2xl font-semibold">
              {formatCurrency(amount, currency)}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {count} {count === 1 ? "invoice" : "invoices"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const { settings } = useUserSettings();
  const defaultCurrency = settings?.default_currency ?? "USD";

  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; invoice: InvoiceWithClient | null }>({
    open: false,
    invoice: null,
  });
  const [voidConfirm, setVoidConfirm] = useState<{ open: boolean; invoice: InvoiceWithClient | null }>({
    open: false,
    invoice: null,
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch clients and projects for filter dropdowns
  const { clients } = useClients({ limit: 100 });
  const { projects } = useProjects({ limit: 100 });

  // Get the effective client filter (from project if selected, otherwise from client filter)
  const effectiveClientId = useMemo(() => {
    if (projectFilter !== "all") {
      const project = projects.find((p) => p.id === projectFilter);
      return project?.client_id || null;
    }
    return clientFilter !== "all" ? clientFilter : undefined;
  }, [projectFilter, clientFilter, projects]);

  // Fetch invoices with filters
  const { invoices, isLoading, mutate } = useInvoices({
    page: 1,
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
    client_id: effectiveClientId || undefined,
  });

  // Mutations
  const { deleteInvoice, markAsPaid, voidInvoice } = useInvoiceMutations();

  // Calculate stats from invoices
  const stats = useMemo(() => {
    const outstanding = invoices.filter((inv) => inv.status === "sent" || inv.status === "overdue");
    const overdue = invoices.filter((inv) => inv.status === "overdue");
    const paidThisYear = invoices.filter((inv) => {
      if (inv.status !== "paid") return false;
      const paidYear = inv.paid_date ? new Date(inv.paid_date).getFullYear() : null;
      return paidYear === new Date().getFullYear();
    });

    return {
      outstanding: {
        amount: outstanding.reduce((sum, inv) => sum + inv.total, 0),
        count: outstanding.length,
      },
      overdue: {
        amount: overdue.reduce((sum, inv) => sum + inv.total, 0),
        count: overdue.length,
      },
      paidThisYear: {
        amount: paidThisYear.reduce((sum, inv) => sum + inv.total, 0),
        count: paidThisYear.length,
      },
    };
  }, [invoices]);

  const handleNewInvoice = () => {
    router.push("/dashboard/invoices/new");
  };

  const handleView = (invoice: InvoiceWithClient) => {
    if (invoice.status === "draft") {
      router.push(`/dashboard/invoices/${invoice.id}/edit`);
    } else {
      router.push(`/dashboard/invoices/${invoice.id}`);
    }
  };

  const handleDownloadPDF = (invoiceId: string) => {
    // TODO: Generate and download PDF
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
  };

  const handleMarkAsPaid = async (invoice: InvoiceWithClient) => {
    setIsActionLoading(true);
    try {
      await markAsPaid(invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice marked as paid",
      });
      mutate();
    } catch (error) {
      console.error("Failed to mark invoice as paid:", error);
      toastManager.add({
        type: "error",
        title: "Failed to mark invoice as paid",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleVoidClick = (invoice: InvoiceWithClient) => {
    setVoidConfirm({ open: true, invoice });
  };

  const handleVoidConfirm = async () => {
    if (!voidConfirm.invoice) return;

    setIsActionLoading(true);
    try {
      await voidInvoice(voidConfirm.invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice voided",
      });
      mutate();
      setVoidConfirm({ open: false, invoice: null });
    } catch (error) {
      console.error("Failed to void invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to void invoice",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteClick = (invoice: InvoiceWithClient) => {
    setDeleteConfirm({ open: true, invoice });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.invoice) return;

    setIsActionLoading(true);
    try {
      await deleteInvoice(deleteConfirm.invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice deleted",
      });
      mutate();
      setDeleteConfirm({ open: false, invoice: null });
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to delete invoice",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Button
          onClick={handleNewInvoice}
          className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
        >
          <Plus className="mr-1 size-4" />
          New Invoice
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Outstanding"
          amount={stats.outstanding.amount}
          count={stats.outstanding.count}
          currency={defaultCurrency}
          isLoading={isLoading}
        />
        <StatCard
          title="Overdue"
          amount={stats.overdue.amount}
          count={stats.overdue.count}
          currency={defaultCurrency}
          isLoading={isLoading}
        />
        <StatCard
          title="Paid (this year)"
          amount={stats.paidThisYear.amount}
          count={stats.paidThisYear.count}
          currency={defaultCurrency}
          isLoading={isLoading}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter((value || "all") as "all" | InvoiceStatus)}>
            <SelectTrigger className="w-36">
              <SelectValue>
                {{
                  all: "All Statuses",
                  draft: "Draft",
                  sent: "Sent",
                  paid: "Paid",
                  overdue: "Overdue",
                  void: "Void",
                }[statusFilter] || "All Statuses"}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="void">Void</SelectItem>
            </SelectPopup>
          </Select>

          <Select
            value={clientFilter}
            onValueChange={(value) => {
              setClientFilter(value || "all");
              // Reset project filter when client changes
              if (value !== "all") {
                setProjectFilter("all");
              }
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {clientFilter === "all"
                  ? "All Clients"
                  : clients.find((c) => c.id === clientFilter)?.name || "All Clients"}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>

          <Select
            value={projectFilter}
            onValueChange={(value) => {
              setProjectFilter(value || "all");
              // When a project is selected, reset the client filter since project determines client
              if (value !== "all") {
                setClientFilter("all");
              }
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue>
                {projectFilter === "all"
                  ? "All Projects"
                  : projects.find((p) => p.id === projectFilter)?.name || "All Projects"}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardContent className="divide-y p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className={cn(
                  "flex items-center gap-4 p-4 hover:bg-accent/30",
                  invoice.status === "void" && "opacity-60"
                )}
              >
                {/* Invoice info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-medium font-mono text-sm">
                      {invoice.invoice_number}
                    </span>
                    <span className="text-sm">{invoice.client.name}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{formatDate(invoice.issue_date)}</span>
                    <span>
                      {invoice.status === "paid" && invoice.paid_date
                        ? `Paid: ${formatDate(invoice.paid_date)}`
                        : `Due: ${formatDate(invoice.due_date)}`}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={cn(
                    "rounded px-2 py-0.5 text-xs font-medium",
                    statusConfig[invoice.status].className
                  )}
                >
                  {statusConfig[invoice.status].label}
                </span>

                {/* Amount */}
                <span className="w-24 text-right font-medium tabular-nums">
                  {formatCurrency(invoice.total, invoice.currency)}
                </span>

                {/* Actions Menu */}
                <Menu>
                  <MenuTrigger className="flex size-8 items-center justify-center rounded-md hover:bg-accent">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </MenuTrigger>
                  <MenuPopup align="end">
                    <MenuItem onClick={() => handleView(invoice)}>
                      {invoice.status === "draft" ? (
                        <>
                          <Pencil className="size-4" />
                          Edit
                        </>
                      ) : (
                        <>
                          <Eye className="size-4" />
                          View
                        </>
                      )}
                    </MenuItem>
                    {invoice.status !== "draft" && (
                      <MenuItem onClick={() => handleDownloadPDF(invoice.id)}>
                        <Download className="size-4" />
                        Download PDF
                      </MenuItem>
                    )}
                    {(invoice.status === "sent" || invoice.status === "overdue") && (
                      <MenuItem onClick={() => handleMarkAsPaid(invoice)} disabled={isActionLoading}>
                        <CheckCircle className="size-4" />
                        Mark as Paid
                      </MenuItem>
                    )}
                    {invoice.status !== "paid" && invoice.status !== "void" && (
                      <>
                        <MenuSeparator />
                        <MenuItem onClick={() => handleVoidClick(invoice)} disabled={isActionLoading}>
                          <XCircle className="size-4" />
                          Void
                        </MenuItem>
                      </>
                    )}
                    {invoice.status === "draft" && (
                      <MenuItem
                        variant="destructive"
                        onClick={() => handleDeleteClick(invoice)}
                        disabled={isActionLoading}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </MenuItem>
                    )}
                  </MenuPopup>
                </Menu>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, invoice: open ? deleteConfirm.invoice : null })}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this invoice? This action cannot be undone.
            </p>
            {deleteConfirm.invoice && (
              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="font-medium font-mono">{deleteConfirm.invoice.invoice_number}</p>
                <p className="text-sm text-muted-foreground">
                  {deleteConfirm.invoice.client.name} • {formatCurrency(deleteConfirm.invoice.total, deleteConfirm.invoice.currency)}
                </p>
              </div>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ open: false, invoice: null })}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Void Confirmation Dialog */}
      <Dialog open={voidConfirm.open} onOpenChange={(open) => setVoidConfirm({ open, invoice: open ? voidConfirm.invoice : null })}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Void Invoice</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to void this invoice? This will mark it as cancelled and cannot be undone.
            </p>
            {voidConfirm.invoice && (
              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="font-medium font-mono">{voidConfirm.invoice.invoice_number}</p>
                <p className="text-sm text-muted-foreground">
                  {voidConfirm.invoice.client.name} • {formatCurrency(voidConfirm.invoice.total, voidConfirm.invoice.currency)}
                </p>
              </div>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button
              variant="outline"
              onClick={() => setVoidConfirm({ open: false, invoice: null })}
              disabled={isActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidConfirm}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Voiding...
                </>
              ) : (
                "Void Invoice"
              )}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
