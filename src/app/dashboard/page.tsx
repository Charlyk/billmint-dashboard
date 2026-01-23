"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { useUserSettings } from "@/contexts/user-settings-context";
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

function formatCurrency(amount: number, currency: string) {
  const locale = currencyLocales[currency] || "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

function formatAmounts(amounts: AmountByCurrency[], defaultCurrency: string = "USD") {
  if (amounts.length === 0) return formatCurrency(0, defaultCurrency);
  return amounts.map(a => formatCurrency(a.amount, a.currency)).join(", ");
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Today"
          primary={stats ? formatHours(stats.today.hours) : "0h 00m"}
          secondary={stats ? formatAmounts(stats.today.amounts, defaultCurrency) : formatCurrency(0, defaultCurrency)}
          isLoading={isLoading}
        />
        <StatCard
          title="This Week"
          primary={stats ? formatHours(stats.this_week.hours) : "0h 00m"}
          secondary={stats ? formatAmounts(stats.this_week.amounts, defaultCurrency) : formatCurrency(0, defaultCurrency)}
          isLoading={isLoading}
        />
        <StatCard
          title="Unbilled"
          primary={stats ? formatAmounts(stats.unbilled.amounts, defaultCurrency) : formatCurrency(0, defaultCurrency)}
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
                          {formatCurrency(entry.amount, entry.project?.currency || defaultCurrency)}
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
