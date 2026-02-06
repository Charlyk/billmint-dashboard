"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { Download, BarChart3, Crown, Lock } from "lucide-react";
import { useReport, useProjects, useClients, usePaidFeature, type ReportsQuery } from "@/lib/hooks";
import { exportReport } from "@/lib/api/reports";
import { billingApi } from "@/lib/api";
import { useUserSettings } from "@/contexts/user-settings-context";
import { formatCurrency } from "@/lib/utils/currency";
import { toastManager } from "@/components/ui/toast";
import type { AmountByCurrency } from "@/types/api";

// Project color name to hex mapping
const colorMap: Record<string, string> = {
  emerald: "#10b981",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  orange: "#f97316",
  yellow: "#eab308",
  slate: "#64748b",
  red: "#ef4444",
};

function getColorHex(colorName: string | null): string {
  return colorName ? colorMap[colorName] ?? "#64748b" : "#64748b";
}

function formatHours(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

type DateRangePreset =
  | "today"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year";

function getDateRange(preset: DateRangePreset): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today": {
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      return { start: today, end };
    }
    case "this_week": {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "last_week": {
      const dayOfWeek = today.getDay();
      const end = new Date(today);
      end.setDate(today.getDate() - dayOfWeek - 1);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "last_month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "this_year": {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

const dateRangeLabels: Record<DateRangePreset, string> = {
  today: "Today",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  this_year: "This Year",
};

function StatCard({
  title,
  primary,
  secondary,
  isLoading,
}: {
  title: string;
  primary: string;
  secondary?: string;
  isLoading?: boolean;
}) {
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
            <p className="mt-1 text-2xl font-semibold">{primary}</p>
            {secondary && (
              <p className="mt-0.5 text-sm text-muted-foreground">{secondary}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const { settings } = useUserSettings();
  const defaultCurrency = settings?.default_currency ?? "USD";
  const { checkAccess, isLoading: isCheckingAccess } = usePaidFeature();
  const { hasAccess } = checkAccess("reports");

  // Filters (locked for free users)
  const [dateRange, setDateRange] = useState<DateRangePreset>("this_month");
  const [projectFilter, setProjectFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Data
  const { projects } = useProjects();
  const { clients } = useClients();

  // Build query
  const query = useMemo<ReportsQuery>(() => {
    const range = getDateRange(dateRange);
    return {
      start_date: range.start.toISOString(),
      end_date: range.end.toISOString(),
      project_id: projectFilter !== "all" ? projectFilter : undefined,
      client_id: clientFilter !== "all" ? clientFilter : undefined,
    };
  }, [dateRange, projectFilter, clientFilter]);

  const { summary, byProject, isLoading } = useReport(query);

  // Format amounts array (handles multiple currencies)
  const formatAmounts = (amounts: AmountByCurrency[]) => {
    if (!amounts || amounts.length === 0) {
      return formatCurrency(0, defaultCurrency, defaultCurrency);
    }
    return amounts
      .map((a) => formatCurrency(a.amount, a.currency, defaultCurrency))
      .join(", ");
  };

  // Calculate totals grouped by currency
  const projectTotalsByCurrency = useMemo(() => {
    const totals: Record<string, { hours: number; amount: number }> = {};
    for (const p of byProject) {
      const currency = p.currency || defaultCurrency;
      if (!totals[currency]) {
        totals[currency] = { hours: 0, amount: 0 };
      }
      totals[currency].hours += p.hours;
      totals[currency].amount += p.amount;
    }
    return totals;
  }, [byProject, defaultCurrency]);

  // Calculate percentages
  const billablePercent = summary && summary.total_hours > 0
    ? Math.round((summary.billable_hours / summary.total_hours) * 100)
    : 0;
  const nonBillablePercent = summary && summary.total_hours > 0
    ? Math.round((summary.non_billable_hours / summary.total_hours) * 100)
    : 0;

  // Calculate total hours
  const projectTotalHours = byProject.reduce((sum, p) => sum + p.hours, 0);

  // Format totals for footer
  const formattedTotals = Object.entries(projectTotalsByCurrency)
    .map(([currency, { amount }]) => formatCurrency(amount, currency, defaultCurrency))
    .join(", ");

  // Handle export
  const handleExport = async () => {
    if (!hasAccess) return;
    setIsExporting(true);
    try {
      const blob = await exportReport(query, "csv");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const range = getDateRange(dateRange);
      const startStr = range.start.toISOString().split("T")[0];
      const endStr = range.end.toISOString().split("T")[0];
      a.download = `time-report-${startStr}-to-${endStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toastManager.add({ type: "success", title: "Report exported successfully" });
    } catch {
      toastManager.add({ type: "error", title: "Failed to export report" });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle upgrade
  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await billingApi.createCheckoutSession("pro");
      window.location.href = response.url;
    } catch {
      toastManager.add({ type: "error", title: "Failed to start checkout" });
      setIsUpgrading(false);
    }
  };

  const hasData = summary && summary.total_hours > 0;

  return (
    <div className="space-y-8">
      {/* Upgrade Banner for Free Users */}
      {!isCheckingAccess && !hasAccess && (
        <Card className="border-teal-500/50 bg-gradient-to-r from-teal-500/10 to-emerald-500/10">
          <CardContent className="py-6">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-teal-500/20">
                <Crown className="size-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-teal-700 dark:text-teal-300">
                  Unlock Advanced Reports
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upgrade to Pro to filter reports by date range, project, or client, and export detailed CSV reports.
                </p>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="shrink-0 bg-teal-500 hover:bg-teal-600"
              >
                {isUpgrading ? (
                  <>
                    <Spinner className="size-4" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    <Crown className="size-4" />
                    Upgrade to Pro
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <Button
          onClick={handleExport}
          disabled={isExporting || !hasData || !hasAccess}
          variant="outline"
        >
          {isExporting ? (
            <Spinner className="size-4" />
          ) : !hasAccess ? (
            <Lock className="size-4" />
          ) : (
            <Download className="size-4" />
          )}
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={dateRange}
          onValueChange={(value) => hasAccess && setDateRange((value || "this_month") as DateRangePreset)}
          disabled={!hasAccess}
        >
          <SelectTrigger className="w-36">
            <SelectValue>{dateRangeLabels[dateRange]}</SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectPopup>
        </Select>

        <Select
          value={projectFilter}
          onValueChange={(value) => hasAccess && setProjectFilter(value || "all")}
          disabled={!hasAccess}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {projectFilter === "all"
                ? "All Projects"
                : projects?.find((p) => p.id === projectFilter)?.name || "All Projects"}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>

        <Select
          value={clientFilter}
          onValueChange={(value) => hasAccess && setClientFilter(value || "all")}
          disabled={!hasAccess}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {clientFilter === "all"
                ? "All Clients"
                : clients?.find((c) => c.id === clientFilter)?.name || "All Clients"}
            </SelectValue>
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="all">All Clients</SelectItem>
            {clients?.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Time"
          primary={summary ? formatHours(summary.total_hours) : "0h 00m"}
          isLoading={isLoading}
        />
        <StatCard
          title="Billable"
          primary={summary ? formatHours(summary.billable_hours) : "0h 00m"}
          secondary={`${billablePercent}% of total`}
          isLoading={isLoading}
        />
        <StatCard
          title="Non-Billable"
          primary={summary ? formatHours(summary.non_billable_hours) : "0h 00m"}
          secondary={`${nonBillablePercent}% of total`}
          isLoading={isLoading}
        />
        <StatCard
          title="Amount"
          primary={summary ? formatAmounts(summary.billable_amounts) : formatCurrency(0, defaultCurrency, defaultCurrency)}
          isLoading={isLoading}
        />
      </div>

      {/* By Project Table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">By Project</h2>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner className="size-6 text-muted-foreground" />
              </div>
            ) : !hasData ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <BarChart3 className="size-5" />
                  </EmptyMedia>
                  <EmptyTitle>No data for this period</EmptyTitle>
                  <EmptyDescription>
                    {hasAccess
                      ? "Try selecting a different date range or clearing filters."
                      : "Track some time to see your reports here."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Project</th>
                      <th className="px-4 py-3 font-medium">Client</th>
                      <th className="px-4 py-3 text-right font-medium">Hours</th>
                      <th className="px-4 py-3 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byProject.map((item) => (
                      <tr
                        key={item.project.id}
                        className="border-b last:border-b-0 hover:bg-accent/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: getColorHex(item.project.color) }}
                            />
                            <span className="font-medium">{item.project.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.client_name || "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatHours(item.hours)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatCurrency(item.amount, item.currency, defaultCurrency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/50 font-medium">
                      <td className="px-4 py-3" colSpan={2}>
                        Total
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatHours(projectTotalHours)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formattedTotals || formatCurrency(0, defaultCurrency, defaultCurrency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
