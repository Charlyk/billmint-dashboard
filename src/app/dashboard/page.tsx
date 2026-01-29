"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { useUserSettings } from "@/contexts/user-settings-context";
import { formatCurrency } from "@/lib/utils/currency";
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

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function StatCard({
  title,
  primary,
  secondary,
  isLoading,
}: {
  title: string;
  primary: string;
  secondary: string;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{title}</p>
        {isLoading ? (
          <div className="mt-1 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <p className="mt-1 text-2xl font-semibold">{primary}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{secondary}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { settings } = useUserSettings();
  const defaultCurrency = settings?.default_currency ?? "USD";
  const { stats, groupedByDate, isLoading } = useDashboard(10);

  const formatAmounts = (amounts: AmountByCurrency[]) => {
    if (amounts.length === 0) return formatCurrency(0, defaultCurrency, defaultCurrency);
    return amounts.map(a => formatCurrency(a.amount, a.currency, defaultCurrency)).join(", ");
  };

  const overdueCount = stats?.overdue_invoices?.count ?? 0;
  const overdueInvoices = stats?.overdue_invoices?.invoices ?? [];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Overdue Invoices Warning */}
      {overdueCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <div className="flex-1">
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {overdueCount === 1
                    ? "You have 1 overdue invoice"
                    : `You have ${overdueCount} overdue invoices`}
                </p>
                <div className="mt-2 space-y-1">
                  {overdueInvoices.slice(0, 3).map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>
                        {" - "}
                        {invoice.client_name}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {invoice.days_overdue} {invoice.days_overdue === 1 ? "day" : "days"} overdue
                      </span>
                    </div>
                  ))}
                  {overdueCount > 3 && (
                    <p className="text-sm text-muted-foreground">
                      and {overdueCount - 3} more...
                    </p>
                  )}
                </div>
                <Link
                  href="/dashboard/invoices?status=overdue"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  View all overdue invoices
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today"
          primary={stats ? formatHours(stats.today.hours) : "0h 00m"}
          secondary={stats ? formatAmounts(stats.today.amounts) : formatCurrency(0, defaultCurrency, defaultCurrency)}
          isLoading={isLoading}
        />
        <StatCard
          title="This Week"
          primary={stats ? formatHours(stats.this_week.hours) : "0h 00m"}
          secondary={stats ? formatAmounts(stats.this_week.amounts) : formatCurrency(0, defaultCurrency, defaultCurrency)}
          isLoading={isLoading}
        />
        <StatCard
          title="Unbilled"
          primary={stats ? formatAmounts(stats.unbilled.amounts) : formatCurrency(0, defaultCurrency, defaultCurrency)}
          secondary={stats ? `${formatHours(stats.unbilled.hours)} tracked` : "0h 00m tracked"}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Entries */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Entries</h2>
          <Link
            href="/dashboard/time-entries"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            View all
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <Card className="mt-4">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : groupedByDate.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No time entries yet. Start tracking time to see your entries here.
              </div>
            ) : (
              groupedByDate.map((group, groupIndex) => (
                <div key={group.date}>
                  {groupIndex > 0 && <div className="border-t" />}
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {formatDate(group.date)}
                    </p>
                  </div>
                  <div className="space-y-1 px-4 pb-4">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-lg py-2 hover:bg-accent/50"
                      >
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: getColorHex(entry.project?.color ?? null) }}
                        />
                        <span className="flex-1 truncate text-sm">
                          {entry.description || "No description"}
                        </span>
                        <span className="hidden text-sm text-muted-foreground sm:block">
                          {entry.project?.name || "No project"}
                        </span>
                        <span className="w-16 text-right text-sm tabular-nums">
                          {formatHours(entry.duration_seconds / 3600)}
                        </span>
                        <span className="w-20 text-right text-sm font-medium tabular-nums">
                          {formatCurrency(entry.amount, entry.client?.currency || defaultCurrency, defaultCurrency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
