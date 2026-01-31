"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Copy,
  Mail,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useInvoices, useInvoiceMutations, useInvoiceStats, useClients, useProjects } from "@/lib/hooks";
import { useUserSettings, useTimezone } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
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

function formatDate(dateString: string, timezone: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  });
}

function StatCard({
  title,
  amounts,
  count,
  userCurrency,
  isLoading,
}: {
  title: string;
  amounts: { currency: string; amount: number }[];
  count: number;
  userCurrency: string;
  isLoading?: boolean;
}) {
  const displayAmounts = amounts.length > 0
    ? amounts.map(a => formatCurrency(a.amount, a.currency, userCurrency)).join(", ")
    : formatCurrency(0, userCurrency, userCurrency);

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{title}</p>
        {isLoading ? (
          <div className="mt-1 flex items-center gap-2">
            <Spinner className="size-4 text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="mt-1 text-2xl font-semibold">
              {displayAmounts}
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
  const searchParams = useSearchParams();
  const { settings } = useUserSettings();
  const timezone = useTimezone();
  const defaultCurrency = settings?.default_currency ?? "USD";

  // Initialize filters from URL query params
  const initialStatus = searchParams.get("status") as InvoiceStatus | null;
  const initialClient = searchParams.get("client");
  const initialProject = searchParams.get("project");

  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>(
    initialStatus && ["draft", "sent", "paid", "overdue", "void"].includes(initialStatus) ? initialStatus : "all"
  );
  const [clientFilter, setClientFilter] = useState(initialClient || "all");
  const [projectFilter, setProjectFilter] = useState(initialProject || "all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; invoice: InvoiceWithClient | null }>({
    open: false,
    invoice: null,
  });
  const [voidConfirm, setVoidConfirm] = useState<{ open: boolean; invoice: InvoiceWithClient | null }>({
    open: false,
    invoice: null,
  });
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);

  // Fetch clients and projects for filter dropdowns
  const { clients } = useClients({ limit: 100 });
  const { projects } = useProjects({ limit: 100 });

  // Fetch invoices with filters
  const { invoices, isLoading, mutate } = useInvoices({
    page: 1,
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
    client_id: clientFilter !== "all" ? clientFilter : undefined,
    project_id: projectFilter !== "all" ? projectFilter : undefined,
  });

  // Mutations
  const { deleteInvoice, markAsPaid, voidInvoice, duplicateInvoice, sendReminder } = useInvoiceMutations();

  // Fetch invoice stats (from database, independent of filters/pagination)
  const { stats, isLoading: isStatsLoading, mutate: mutateStats } = useInvoiceStats();

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

  const handleDownloadPDF = async (invoice: InvoiceWithClient) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toastManager.add({
        type: 'error',
        title: 'Failed to download PDF',
      });
    }
  };

  const handleDuplicate = async (invoice: InvoiceWithClient) => {
    setLoadingInvoiceId(invoice.id);
    try {
      const newInvoice = await duplicateInvoice(invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice duplicated",
        description: `Created ${newInvoice.invoice_number} as draft`,
      });
      mutate();
    } catch (error) {
      console.error("Failed to duplicate invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to duplicate invoice",
      });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleMarkAsPaid = async (invoice: InvoiceWithClient) => {
    setLoadingInvoiceId(invoice.id);
    try {
      await markAsPaid(invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice marked as paid",
      });
      mutate();
      mutateStats();
    } catch (error) {
      console.error("Failed to mark invoice as paid:", error);
      toastManager.add({
        type: "error",
        title: "Failed to mark invoice as paid",
      });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleSendReminder = async (invoice: InvoiceWithClient) => {
    setLoadingInvoiceId(invoice.id);
    try {
      await sendReminder(invoice.id);
      toastManager.add({
        type: "success",
        title: "Reminder sent",
        description: `Payment reminder sent to ${invoice.client.email || invoice.client.name}`,
      });
      mutate();
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toastManager.add({
        type: "error",
        title: "Failed to send reminder",
      });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleVoidClick = (invoice: InvoiceWithClient) => {
    setVoidConfirm({ open: true, invoice });
  };

  const handleVoidConfirm = async () => {
    if (!voidConfirm.invoice) return;

    setLoadingInvoiceId(voidConfirm.invoice.id);
    try {
      await voidInvoice(voidConfirm.invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice voided",
      });
      mutate();
      mutateStats();
      setVoidConfirm({ open: false, invoice: null });
    } catch (error) {
      console.error("Failed to void invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to void invoice",
      });
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleDeleteClick = (invoice: InvoiceWithClient) => {
    setDeleteConfirm({ open: true, invoice });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.invoice) return;

    setLoadingInvoiceId(deleteConfirm.invoice.id);
    try {
      await deleteInvoice(deleteConfirm.invoice.id);
      toastManager.add({
        type: "success",
        title: "Invoice deleted",
      });
      mutate();
      mutateStats();
      setDeleteConfirm({ open: false, invoice: null });
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to delete invoice",
      });
    } finally {
      setLoadingInvoiceId(null);
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
          amounts={stats?.outstanding.amounts || []}
          count={stats?.outstanding.count || 0}
          userCurrency={defaultCurrency}
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Overdue"
          amounts={stats?.overdue.amounts || []}
          count={stats?.overdue.count || 0}
          userCurrency={defaultCurrency}
          isLoading={isStatsLoading}
        />
        <StatCard
          title="Paid (this year)"
          amounts={stats?.paid_this_year.amounts || []}
          count={stats?.paid_this_year.count || 0}
          userCurrency={defaultCurrency}
          isLoading={isStatsLoading}
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
            onValueChange={(value) => setClientFilter(value || "all")}
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
            onValueChange={(value) => setProjectFilter(value || "all")}
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
              <Spinner className="size-6 text-muted-foreground" />
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
                    <span>{formatDate(invoice.issue_date, timezone)}</span>
                    <span>
                      {invoice.status === "paid" && invoice.paid_date
                        ? `Paid: ${formatDate(invoice.paid_date, timezone)}`
                        : `Due: ${formatDate(invoice.due_date, timezone)}`}
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
                  {formatCurrency(invoice.total, invoice.currency, defaultCurrency)}
                </span>

                {/* Actions Menu */}
                {loadingInvoiceId === invoice.id ? (
                  <div className="flex size-8 items-center justify-center">
                    <Spinner className="size-4 text-muted-foreground" />
                  </div>
                ) : (
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
                        <MenuItem onClick={() => handleDownloadPDF(invoice)}>
                          <Download className="size-4" />
                          Download PDF
                        </MenuItem>
                      )}
                      <MenuItem onClick={() => handleDuplicate(invoice)} disabled={loadingInvoiceId !== null}>
                        <Copy className="size-4" />
                        Duplicate
                      </MenuItem>
                      {(invoice.status === "sent" || invoice.status === "overdue") && (
                        <>
                          <MenuItem onClick={() => handleSendReminder(invoice)} disabled={loadingInvoiceId !== null}>
                            <Mail className="size-4" />
                            Send Reminder
                          </MenuItem>
                          <MenuItem onClick={() => handleMarkAsPaid(invoice)} disabled={loadingInvoiceId !== null}>
                            <CheckCircle className="size-4" />
                            Mark as Paid
                          </MenuItem>
                        </>
                      )}
                      {invoice.status !== "paid" && invoice.status !== "void" && (
                        <>
                          <MenuSeparator />
                          <MenuItem onClick={() => handleVoidClick(invoice)} disabled={loadingInvoiceId !== null}>
                            <XCircle className="size-4" />
                            Void
                          </MenuItem>
                        </>
                      )}
                      {invoice.status === "draft" && (
                        <MenuItem
                          variant="destructive"
                          onClick={() => handleDeleteClick(invoice)}
                          disabled={loadingInvoiceId !== null}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </MenuItem>
                      )}
                    </MenuPopup>
                  </Menu>
                )}
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
                  {deleteConfirm.invoice.client.name} • {formatCurrency(deleteConfirm.invoice.total, deleteConfirm.invoice.currency, defaultCurrency)}
                </p>
              </div>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ open: false, invoice: null })}
              disabled={loadingInvoiceId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={loadingInvoiceId !== null}
            >
              {loadingInvoiceId === deleteConfirm.invoice?.id ? (
                <>
                  <Spinner className="mr-2 size-4" />
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
                  {voidConfirm.invoice.client.name} • {formatCurrency(voidConfirm.invoice.total, voidConfirm.invoice.currency, defaultCurrency)}
                </p>
              </div>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button
              variant="outline"
              onClick={() => setVoidConfirm({ open: false, invoice: null })}
              disabled={loadingInvoiceId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidConfirm}
              disabled={loadingInvoiceId !== null}
            >
              {loadingInvoiceId === voidConfirm.invoice?.id ? (
                <>
                  <Spinner className="mr-2 size-4" />
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
