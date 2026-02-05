"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import { X, Check, Circle, ArrowRight, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useUserSettings } from "@/contexts/user-settings-context";
import { useTimerContext } from "@/contexts/timer-context";
import { userApi, dashboardApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  key: string;
  label: string;
  completed: boolean;
  href?: string;
  actionLabel: string;
  onClick?: () => void;
}

// SWR key for onboarding stats - exported so other components can trigger refresh
export const ONBOARDING_STATS_KEY = "onboarding-stats";

// Function to refresh onboarding stats from anywhere in the app
export function refreshOnboardingStats() {
  mutate(ONBOARDING_STATS_KEY);
}

export function OnboardingChecklist() {
  const { settings, refetchSettings } = useUserSettings();
  const { startTimer, isRunning } = useTimerContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isLocallyDismissed, setIsLocallyDismissed] = useState(false);

  // Fetch dashboard stats for completion detection using SWR
  const { data: stats } = useSWR(
    ONBOARDING_STATS_KEY,
    async () => {
      const data = await dashboardApi.getDashboardData(1);
      return {
        active_clients: data.stats.active_clients,
        active_projects: data.stats.active_projects,
        total_time_entries: data.stats.total_time_entries,
        total_invoices: data.stats.total_invoices,
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  );

  const hasClients = (stats?.active_clients ?? 0) > 0;
  const hasProjects = (stats?.active_projects ?? 0) > 0;
  const hasTimeEntries = (stats?.total_time_entries ?? 0) > 0;
  const hasInvoices = (stats?.total_invoices ?? 0) > 0;

  const handleStartTimer = useCallback(() => {
    if (!isRunning) {
      startTimer();
    }
  }, [isRunning, startTimer]);

  const items: ChecklistItem[] = [
    {
      key: "clients",
      label: "Create your first client",
      completed: hasClients,
      href: "/dashboard/clients?new=true",
      actionLabel: "Add client",
    },
    {
      key: "projects",
      label: "Create a project",
      completed: hasProjects,
      href: "/dashboard/projects?new=true",
      actionLabel: "Add project",
    },
    {
      key: "time",
      label: "Track your time",
      completed: hasTimeEntries,
      actionLabel: isRunning ? "Timer running" : "Start tracking",
      onClick: handleStartTimer,
    },
    {
      key: "invoices",
      label: "Send an invoice",
      completed: hasInvoices,
      href: "/dashboard/invoices/new",
      actionLabel: "Create invoice",
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const progressValue = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  const isDismissedFromSettings = !!settings?.onboarding_dismissed_at;
  // Only show when we have loaded stats data - prevents flashing
  const hasLoadedStats = stats !== undefined;
  const shouldShow = hasLoadedStats && !isComplete && !isDismissedFromSettings && !isLocallyDismissed;

  const handleDismiss = useCallback(async () => {
    setIsDismissing(true);
    try {
      await userApi.dismissOnboarding();
      setIsLocallyDismissed(true);
      refetchSettings();
    } catch (error) {
      console.error("Failed to dismiss onboarding:", error);
      setIsDismissing(false);
    }
  }, [refetchSettings]);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border bg-card shadow-lg md:bottom-8 md:right-8 md:max-w-[calc(100vw-4rem)]">
      {/* Header - Always visible */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-semibold text-sm">Setup guide</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronUp className="size-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            disabled={isDismissing}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Dismiss setup guide"
          >
            {isDismissing ? (
              <Spinner className="size-4" />
            ) : (
              <X className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Progress bar - Always visible */}
      <div className="px-4 pb-3">
        <Progress value={progressValue}>
          <ProgressTrack className="h-1.5">
            <ProgressIndicator className="bg-teal-500" />
          </ProgressTrack>
        </Progress>
      </div>

      {/* Expandable content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="border-t px-4 py-2">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-2 py-2"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {item.completed ? (
                  <div className="size-4 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
                    <Check className="size-2.5 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <Circle className="size-4 text-muted-foreground/40 shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm truncate",
                    item.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
              {!item.completed && (
                item.onClick ? (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 text-xs shrink-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                    onClick={item.onClick}
                    disabled={item.key === "time" && isRunning}
                  >
                    {item.actionLabel}
                    {!isRunning && <ArrowRight className="size-3 ml-0.5" />}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="xs"
                    className="h-6 text-xs shrink-0 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                    render={<Link href={item.href!} />}
                  >
                    {item.actionLabel}
                    <ArrowRight className="size-3 ml-0.5" />
                  </Button>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
