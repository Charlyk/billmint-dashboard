"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";

interface Invoice {
  id: string;
  number: string;
  client: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  status: InvoiceStatus;
  amount: number;
}

// Mock data
const invoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2026-0012",
    client: "ClientName Inc.",
    issueDate: "Jan 15, 2026",
    dueDate: "Jan 30, 2026",
    status: "sent",
    amount: 2450.0,
  },
  {
    id: "2",
    number: "INV-2026-0011",
    client: "StartupXYZ",
    issueDate: "Jan 10, 2026",
    dueDate: "Jan 25, 2026",
    status: "overdue",
    amount: 1200.0,
  },
  {
    id: "3",
    number: "INV-2026-0010",
    client: "ClientName Inc.",
    issueDate: "Jan 5, 2026",
    dueDate: "Jan 20, 2026",
    paidDate: "Jan 12, 2026",
    status: "paid",
    amount: 3200.0,
  },
  {
    id: "4",
    number: "INV-2026-0009",
    client: "StartupXYZ",
    issueDate: "Dec 20, 2025",
    dueDate: "Jan 4, 2026",
    paidDate: "Jan 2, 2026",
    status: "paid",
    amount: 1800.0,
  },
  {
    id: "5",
    number: "INV-2026-0013",
    client: "Legacy Corp",
    issueDate: "Jan 18, 2026",
    dueDate: "Feb 2, 2026",
    status: "draft",
    amount: 950.0,
  },
  {
    id: "6",
    number: "INV-2025-0042",
    client: "Old Client",
    issueDate: "Nov 1, 2025",
    dueDate: "Nov 15, 2025",
    status: "void",
    amount: 500.0,
  },
];

const stats = {
  outstanding: {
    amount: 4850,
    count: 3,
  },
  overdue: {
    amount: 1200,
    count: 1,
  },
  paidThisYear: {
    amount: 24600,
    count: 12,
  },
};

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

function StatCard({
  title,
  amount,
  count,
}: {
  title: string;
  amount: number;
  count: number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold">
          ${amount.toLocaleString()}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {count} {count === 1 ? "invoice" : "invoices"}
        </p>
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [invoiceList, setInvoiceList] = useState(invoices);

  const filteredInvoices = invoiceList.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (clientFilter !== "all" && inv.client !== clientFilter) return false;
    return true;
  });

  const handleNewInvoice = () => {
    router.push("/dashboard/invoices/new");
  };

  const handleView = (invoice: Invoice) => {
    if (invoice.status === "draft") {
      router.push(`/dashboard/invoices/${invoice.id}/edit`);
    } else {
      router.push(`/dashboard/invoices/${invoice.id}`);
    }
  };

  const handleDownloadPDF = (invoiceId: string) => {
    // TODO: Generate and download PDF
    console.log("Download PDF:", invoiceId);
  };

  const handleMarkAsPaid = (invoiceId: string) => {
    setInvoiceList((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: "paid" as InvoiceStatus, paidDate: "Jan 22, 2026" }
          : inv
      )
    );
  };

  const handleVoid = (invoiceId: string) => {
    setInvoiceList((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "void" as InvoiceStatus } : inv
      )
    );
  };

  const handleDelete = (invoiceId: string) => {
    setInvoiceList((prev) => prev.filter((inv) => inv.id !== invoiceId));
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
        />
        <StatCard
          title="Overdue"
          amount={stats.overdue.amount}
          count={stats.overdue.count}
        />
        <StatCard
          title="Paid (this year)"
          amount={stats.paidThisYear.amount}
          count={stats.paidThisYear.count}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 py-4">
          <span className="text-sm text-muted-foreground">Filter:</span>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
            <SelectTrigger className="w-36">
              <SelectValue />
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

          <Select value={clientFilter} onValueChange={(value) => setClientFilter(value || "all")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="ClientName Inc.">ClientName Inc.</SelectItem>
              <SelectItem value="StartupXYZ">StartupXYZ</SelectItem>
              <SelectItem value="Legacy Corp">Legacy Corp</SelectItem>
            </SelectPopup>
          </Select>
        </CardContent>
      </Card>

      {/* Invoice List */}
      <Card>
        <CardContent className="divide-y p-0">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No invoices found. Create your first invoice to get started.
            </div>
          ) : (
            filteredInvoices.map((invoice) => (
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
                      {invoice.number}
                    </span>
                    <span className="text-sm">{invoice.client}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{invoice.issueDate}</span>
                    <span>
                      {invoice.status === "paid" && invoice.paidDate
                        ? `Paid: ${invoice.paidDate}`
                        : `Due: ${invoice.dueDate}`}
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
                  ${invoice.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                    <MenuItem onClick={() => handleDownloadPDF(invoice.id)}>
                      <Download className="size-4" />
                      Download PDF
                    </MenuItem>
                    {(invoice.status === "sent" ||
                      invoice.status === "overdue") && (
                      <MenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                        <CheckCircle className="size-4" />
                        Mark as Paid
                      </MenuItem>
                    )}
                    {invoice.status !== "paid" && invoice.status !== "void" && (
                      <>
                        <MenuSeparator />
                        <MenuItem onClick={() => handleVoid(invoice.id)}>
                          <XCircle className="size-4" />
                          Void
                        </MenuItem>
                      </>
                    )}
                    {invoice.status === "draft" && (
                      <MenuItem
                        variant="destructive"
                        onClick={() => handleDelete(invoice.id)}
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
    </div>
  );
}
