"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogClose,
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
  DollarSign,
  Minus,
  Pencil,
  Copy,
  Trash2,
  Loader2,
  Calendar,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { Collapsible, CollapsibleTrigger, CollapsiblePanel } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useTimeEntries, useTimeEntryMutations, useProjects, useClients } from "@/lib/hooks";
import { bulkTimeEntryAction } from "@/lib/api/time-entries";
import { useUserSettings } from "@/contexts/user-settings-context";
import {
  formatDurationHuman,
  getStartOfDay,
  getEndOfDay,
  getCurrentWeekRange,
  getCurrentMonthRange,
  addDays,
} from "@/lib/utils/date";
import { TimeRangeDisplay } from "@/components/ui/time-display";
import { toastManager } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
import type { TimeEntryWithDetails } from "@/types";

// Color map for project colors
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

// Get date range based on filter selection
function getDateRange(filter: string, customStart?: string, customEnd?: string): { start_date?: string; end_date?: string } {
  const now = new Date();

  switch (filter) {
    case "today": {
      const start = getStartOfDay(now);
      const end = getEndOfDay(now);
      return { start_date: start.toISOString(), end_date: end.toISOString() };
    }
    case "yesterday": {
      const yesterday = addDays(now, -1);
      const start = getStartOfDay(yesterday);
      const end = getEndOfDay(yesterday);
      return { start_date: start.toISOString(), end_date: end.toISOString() };
    }
    case "last-7-days": {
      const start = getStartOfDay(addDays(now, -6));
      const end = getEndOfDay(now);
      return { start_date: start.toISOString(), end_date: end.toISOString() };
    }
    case "this-week": {
      const { start, end } = getCurrentWeekRange();
      return { start_date: start.toISOString(), end_date: end.toISOString() };
    }
    case "last-week": {
      const { start: thisWeekStart } = getCurrentWeekRange();
      const lastWeekStart = addDays(thisWeekStart, -7);
      const lastWeekEnd = addDays(thisWeekStart, -1);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return { start_date: lastWeekStart.toISOString(), end_date: lastWeekEnd.toISOString() };
    }
    case "this-month": {
      const { start, end } = getCurrentMonthRange();
      return { start_date: start.toISOString(), end_date: end.toISOString() };
    }
    case "last-month": {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start_date: lastMonthStart.toISOString(), end_date: lastMonthEnd.toISOString() };
    }
    case "custom": {
      if (customStart && customEnd) {
        const start = getStartOfDay(new Date(customStart));
        const end = getEndOfDay(new Date(customEnd));
        return { start_date: start.toISOString(), end_date: end.toISOString() };
      }
      return {};
    }
    default:
      return {};
  }
}

// Group entries by date
function groupEntriesByDate(entries: TimeEntryWithDetails[]) {
  const groups: Map<string, { date: string; displayDate: string; entries: TimeEntryWithDetails[]; totalSeconds: number }> = new Map();

  for (const entry of entries) {
    const date = new Date(entry.start_time);
    const dateKey = date.toISOString().split("T")[0];
    const displayDate = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { date: dateKey, displayDate, entries: [], totalSeconds: 0 });
    }

    const group = groups.get(dateKey)!;
    group.entries.push(entry);
    group.totalSeconds += entry.duration_seconds;
  }

  // Sort groups by date (newest first)
  return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date));
}

type EntryModalMode = "add" | "edit";

interface EntryFormData {
  id?: string;
  description: string;
  project_id: string | null;
  date: string;
  startTime: string;
  endTime: string;
  is_billable: boolean;
}

const defaultFormData: EntryFormData = {
  description: "",
  project_id: null,
  date: new Date().toISOString().split("T")[0],
  startTime: "09:00",
  endTime: "10:00",
  is_billable: true,
};

export default function TimeEntriesPage() {
  const { settings } = useUserSettings();
  const defaultCurrency = settings?.default_currency ?? "USD";
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const initialProjectFilter = searchParams.get("project") || "all";
  // When coming from a project link, show all time entries for that project
  const initialDateRange = initialProjectFilter !== "all" ? "all" : "last-7-days";

  const [dateRange, setDateRange] = useState(initialDateRange);
  const [projectFilter, setProjectFilter] = useState(initialProjectFilter);
  const [clientFilter, setClientFilter] = useState("all");
  const [billableFilter, setBillableFilter] = useState("all");
  const [invoicedFilter, setInvoicedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<EntryModalMode>("add");
  const [formData, setFormData] = useState<EntryFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; entry: TimeEntryWithDetails | null }>({
    open: false,
    entry: null,
  });

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Custom date range state (applied values)
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Custom date range modal state (temporary values)
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [customRangeTab, setCustomRangeTab] = useState<"start" | "end">("start");

  // Filters collapsed state (collapsed by default on mobile, open on desktop)
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Collapse filters on mobile by default
  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      setFiltersOpen(false);
    }
  }, []);

  // Pagination state
  const [page, setPage] = useState(1);
  const [allEntries, setAllEntries] = useState<TimeEntryWithDetails[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get date range for API query
  const dateRangeFilter = useMemo(
    () => getDateRange(dateRange, customStartDate, customEndDate),
    [dateRange, customStartDate, customEndDate]
  );

  // Fetch time entries with filters
  const { entries, pagination, isLoading, mutate } = useTimeEntries({
    page,
    limit: 100,
    ...dateRangeFilter,
    project_id: projectFilter !== "all" ? projectFilter : undefined,
    client_id: clientFilter !== "all" ? clientFilter : undefined,
    is_billable: billableFilter !== "all" ? billableFilter === "billable" : undefined,
    is_invoiced: invoicedFilter !== "all" ? invoicedFilter === "invoiced" : undefined,
    search: debouncedSearch || undefined,
  });

  // Accumulate entries when new data loads (only when not loading to avoid stale data)
  useEffect(() => {
    if (isLoading) return;

    if (entries.length > 0) {
      if (page === 1) {
        setAllEntries(entries);
      } else {
        setAllEntries((prev) => [...prev, ...entries]);
      }
    } else if (page === 1) {
      setAllEntries([]);
    }
  }, [entries, page, isLoading]);

  // Reset to page 1 and clear selection when filters change
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [dateRange, projectFilter, clientFilter, billableFilter, invoicedFilter, debouncedSearch, customStartDate, customEndDate]);

  // Fetch projects and clients for filter dropdowns
  const { projects } = useProjects({ limit: 100 });
  const { clients } = useClients({ limit: 100 });

  // Mutations
  const { createTimeEntry, updateTimeEntry, deleteTimeEntry } = useTimeEntryMutations();

  // Group entries by date
  const groupedEntries = useMemo(() => groupEntriesByDate(allEntries), [allEntries]);

  // Get selectable entries (non-invoiced only)
  const selectableEntries = useMemo(
    () => allEntries.filter((e) => !e.invoice_id),
    [allEntries]
  );

  // Select all state
  const allSelected = selectableEntries.length > 0 && selectableEntries.every((e) => selectedIds.has(e.id));
  const someSelected = selectableEntries.some((e) => selectedIds.has(e.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableEntries.map((e) => e.id)));
    }
  };

  const handleSelectEntry = (entryId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleBulkAction = async (action: 'delete' | 'mark-billable' | 'mark-non-billable') => {
    if (selectedIds.size === 0 || isBulkActionLoading) return;

    if (action === 'delete') {
      setBulkDeleteConfirm(true);
      return;
    }

    setIsBulkActionLoading(true);
    try {
      const result = await bulkTimeEntryAction(action, Array.from(selectedIds));
      toastManager.add({
        type: "success",
        title: action === 'mark-billable' ? "Marked as billable" : "Marked as non-billable",
        description: `${result.affected_count} entries updated`,
      });
      setSelectedIds(new Set());
      setPage(1);
      mutate();
    } catch (error) {
      console.error("Bulk action failed:", error);
      toastManager.add({
        type: "error",
        title: "Action failed",
        description: "Failed to update entries",
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0 || isBulkActionLoading) return;

    setIsBulkActionLoading(true);
    try {
      const result = await bulkTimeEntryAction('delete', Array.from(selectedIds));
      toastManager.add({
        type: "success",
        title: "Entries deleted",
        description: `${result.affected_count} entries deleted`,
      });
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
      setPage(1);
      mutate();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toastManager.add({
        type: "error",
        title: "Delete failed",
        description: "Failed to delete entries",
      });
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  // Get selected entries for preview in bulk delete dialog
  const selectedEntries = useMemo(
    () => allEntries.filter((e) => selectedIds.has(e.id)),
    [allEntries, selectedIds]
  );

  // Calculate summary
  const summary = useMemo(() => {
    const totalSeconds = allEntries.reduce((acc, e) => acc + e.duration_seconds, 0);

    // Group billable amounts by currency
    const billableByCurrency = allEntries
      .filter((e) => e.is_billable && e.amount)
      .reduce<Record<string, number>>((acc, e) => {
        const currency = e.project?.currency ?? defaultCurrency;
        acc[currency] = (acc[currency] || 0) + (e.amount || 0);
        return acc;
      }, {});

    // Format each currency total
    const billableStrings = Object.entries(billableByCurrency)
      .map(([currency, amount]) => formatCurrency(amount, currency, defaultCurrency))
      .join(" + ");

    return {
      count: pagination?.total ?? allEntries.length,
      totalTime: formatDurationHuman(totalSeconds),
      totalBillable: billableStrings || formatCurrency(0, defaultCurrency, defaultCurrency),
    };
  }, [allEntries, pagination, defaultCurrency]);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (entry: TimeEntryWithDetails) => {
    const startDate = new Date(entry.start_time);
    const endDate = entry.end_time ? new Date(entry.end_time) : new Date(startDate.getTime() + entry.duration_seconds * 1000);

    setModalMode("edit");
    setFormData({
      id: entry.id,
      description: entry.description || "",
      project_id: entry.project_id,
      date: startDate.toISOString().split("T")[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endTime: endDate.toTimeString().slice(0, 5),
      is_billable: entry.is_billable,
    });
    setIsModalOpen(true);
  };

  const handleSaveEntry = async () => {
    if (isSubmitting) return;

    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    // Validation: End time must be after start time
    if (endDateTime <= startDateTime) {
      toastManager.add({
        type: "error",
        title: "Invalid time range",
        description: "End time must be after start time",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const entryData = {
        description: formData.description || undefined,
        project_id: formData.project_id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        is_billable: formData.is_billable,
      };

      if (modalMode === "edit" && formData.id) {
        await updateTimeEntry(formData.id, entryData);
      } else {
        await createTimeEntry(entryData);
      }

      setPage(1);
      mutate();
      setIsModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      console.error("Failed to save entry:", error);
      toastManager.add({
        type: "error",
        title: "Failed to save entry",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBillable = async (entry: TimeEntryWithDetails) => {
    try {
      await updateTimeEntry(entry.id, { is_billable: !entry.is_billable });
      setPage(1);
      mutate();
    } catch (error) {
      console.error("Failed to toggle billable:", error);
    }
  };

  const handleDuplicate = async (entry: TimeEntryWithDetails) => {
    try {
      const now = new Date();
      await createTimeEntry({
        description: entry.description || undefined,
        project_id: entry.project_id,
        start_time: now.toISOString(),
        end_time: new Date(now.getTime() + entry.duration_seconds * 1000).toISOString(),
        is_billable: entry.is_billable,
      });
      setPage(1);
      mutate();
    } catch (error) {
      console.error("Failed to duplicate entry:", error);
    }
  };

  const handleDeleteClick = (entry: TimeEntryWithDetails) => {
    setDeleteConfirm({ open: true, entry });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.entry) return;

    try {
      await deleteTimeEntry(deleteConfirm.entry.id);
      setPage(1);
      mutate();
      setDeleteConfirm({ open: false, entry: null });
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toastManager.add({
        type: "error",
        title: "Failed to delete entry",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Time Entries</h1>
        <Button
          onClick={handleOpenAddModal}
          className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
        >
          <Plus className="mr-1 size-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          {/* Mobile toggle header */}
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 sm:hidden">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="size-4" />
              Filters
            </div>
            <ChevronDown className={cn("size-4 transition-transform", filtersOpen && "rotate-180")} />
          </CollapsibleTrigger>

          {/* Desktop always visible, mobile collapsible */}
          <CollapsiblePanel className="sm:!h-auto">
            <CardContent className="grid grid-cols-2 gap-4 py-4 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
              {/* Search */}
              <div className="col-span-2 sm:w-40">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Search</label>
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Date Range */}
              <div className="col-span-2 sm:w-44">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date Range</label>
                <Select
                  value={dateRange}
                  onValueChange={(value) => {
                    if (value === "custom") {
                      const today = new Date().toISOString().split("T")[0];
                      const weekAgo = addDays(new Date(), -6).toISOString().split("T")[0];
                      setTempStartDate(customStartDate || weekAgo);
                      setTempEndDate(customEndDate || today);
                      setCustomRangeTab("start");
                      setCustomRangeOpen(true);
                    } else {
                      setDateRange(value || "last-7-days");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue>
                      {dateRange === "custom" && customStartDate && customEndDate
                        ? `${new Date(customStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(customEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : {
                            "all": "All time",
                            "today": "Today",
                            "yesterday": "Yesterday",
                            "last-7-days": "Last 7 days",
                            "this-week": "This Week",
                            "last-week": "Last Week",
                            "this-month": "This Month",
                            "last-month": "Last Month",
                          }[dateRange] || "Last 7 days"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="last-7-days">Last 7 days</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="last-week">Last Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="custom">
                      <Calendar className="size-4 mr-1.5 inline" />
                      Custom range...
                    </SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              {/* Project */}
              <div className="sm:w-40">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Project</label>
                <Select value={projectFilter} onValueChange={(value) => setProjectFilter(value || "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects">
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
              </div>

              {/* Client */}
              <div className="sm:w-40">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client</label>
                <Select value={clientFilter} onValueChange={(value) => setClientFilter(value || "all")}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Clients">
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
              </div>

              {/* Billable */}
              <div className="sm:w-32">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Billable</label>
                <Select value={billableFilter} onValueChange={(value) => setBillableFilter(value || "all")}>
                  <SelectTrigger>
                    <SelectValue>
                      {{
                        "all": "All",
                        "billable": "Billable",
                        "non-billable": "Non-billable",
                      }[billableFilter] || "All"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="billable">Billable</SelectItem>
                    <SelectItem value="non-billable">Non-billable</SelectItem>
                  </SelectPopup>
                </Select>
              </div>

              {/* Invoiced */}
              <div className="sm:w-32">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Invoiced</label>
                <Select value={invoicedFilter} onValueChange={(value) => setInvoicedFilter(value || "all")}>
                  <SelectTrigger>
                    <SelectValue>
                      {{
                        "all": "All",
                        "invoiced": "Invoiced",
                        "not-invoiced": "Not invoiced",
                      }[invoicedFilter] || "All"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="invoiced">Invoiced</SelectItem>
                    <SelectItem value="not-invoiced">Not invoiced</SelectItem>
                  </SelectPopup>
                </Select>
              </div>
            </CardContent>
          </CollapsiblePanel>
        </Collapsible>
      </Card>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-3">
          <Checkbox
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('mark-billable')}
              disabled={isBulkActionLoading}
            >
              <DollarSign className="mr-1 size-4" />
              Mark Billable
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('mark-non-billable')}
              disabled={isBulkActionLoading}
            >
              <Minus className="mr-1 size-4" />
              Mark Non-billable
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction('delete')}
              disabled={isBulkActionLoading}
            >
              <Trash2 className="mr-1 size-4" />
              Delete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkActionLoading}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Entries List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : groupedEntries.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No time entries found for the selected filters.
            </div>
          ) : (
            groupedEntries.map((group, groupIndex) => (
              <div key={group.date}>
                {groupIndex > 0 && <div className="border-t" />}
                {/* Date Header */}
                <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
                  <span className="font-medium">{group.displayDate}</span>
                  <span className="text-sm text-muted-foreground">
                    Total: {formatDurationHuman(group.totalSeconds)}
                  </span>
                </div>

                {/* Entries */}
                <div className="divide-y">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30"
                    >
                      {/* Selection checkbox (only for non-invoiced entries) */}
                      {!entry.invoice_id ? (
                        <Checkbox
                          checked={selectedIds.has(entry.id)}
                          onCheckedChange={() => handleSelectEntry(entry.id)}
                          className="shrink-0"
                        />
                      ) : (
                        <div className="size-4 shrink-0" />
                      )}

                      {/* Color dot */}
                      <span
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getColorHex(entry.project?.color ?? null) }}
                      />

                      {/* Description and time */}
                      <div className="flex-1 min-w-0">
                        <span className="block truncate text-sm">
                          {entry.description || <span className="text-muted-foreground italic">No description</span>}
                        </span>
                        <TimeRangeDisplay
                          startTime={entry.start_time}
                          endTime={entry.end_time}
                          className="text-xs text-muted-foreground tabular-nums"
                        />
                      </div>

                      {/* Billable toggle */}
                      <button
                        onClick={() => handleToggleBillable(entry)}
                        className={cn(
                          "flex size-6 items-center justify-center rounded",
                          entry.is_billable
                            ? "bg-teal-500/10 text-teal-600"
                            : "bg-muted text-muted-foreground"
                        )}
                        title={entry.is_billable ? "Billable" : "Non-billable"}
                      >
                        {entry.is_billable ? (
                          <DollarSign className="size-3.5" />
                        ) : (
                          <Minus className="size-3.5" />
                        )}
                      </button>

                      {/* Project */}
                      <span className="hidden w-24 truncate text-sm text-muted-foreground sm:block">
                        {entry.project?.name || "–"}
                      </span>

                      {/* Duration */}
                      <span className="w-16 text-right text-sm tabular-nums">
                        {formatDurationHuman(entry.duration_seconds)}
                      </span>

                      {/* Amount */}
                      <span className="w-20 text-right text-sm font-medium tabular-nums">
                        {entry.is_billable && entry.amount
                          ? formatCurrency(entry.amount, entry.project?.currency ?? defaultCurrency, defaultCurrency)
                          : "–"}
                      </span>

                      {/* Actions Menu */}
                      <Menu>
                        <MenuTrigger
                          className="flex size-8 items-center justify-center rounded-md hover:bg-accent"
                        >
                          <MoreVertical className="size-4 text-muted-foreground" />
                        </MenuTrigger>
                        <MenuPopup align="end">
                          <MenuItem onClick={() => handleOpenEditModal(entry)}>
                            <Pencil className="size-4" />
                            Edit
                          </MenuItem>
                          <MenuItem onClick={() => handleDuplicate(entry)}>
                            <Copy className="size-4" />
                            Duplicate
                          </MenuItem>
                          <MenuSeparator />
                          <MenuItem
                            variant="destructive"
                            onClick={() => handleDeleteClick(entry)}
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </MenuItem>
                        </MenuPopup>
                      </Menu>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Load More Button */}
      {pagination && pagination.page < pagination.totalPages && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}

      {/* Summary Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Showing {allEntries.length} of {summary.count} entries • {summary.totalTime} total •{" "}
        {summary.totalBillable} billable
      </div>

      {/* Add/Edit Entry Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>
              {modalMode === "add" ? "Add Time Entry" : "Edit Time Entry"}
            </DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <div className="space-y-4">
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  placeholder="What did you work on?"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select
                  value={formData.project_id || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value || null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project (optional)">
                      {formData.project_id
                        ? projects.find((p) => p.id === formData.project_id)?.name || "Select project"
                        : "No project"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectPopup>
                    <SelectItem value="">No project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Start Time</FieldLabel>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel>End Time</FieldLabel>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </Field>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_billable}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_billable: checked as boolean })
                  }
                />
                <label className="text-sm">Billable</label>
              </div>
            </div>
          </DialogPanel>
          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveEntry}
              disabled={isSubmitting}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
            >
              {isSubmitting ? "Saving..." : modalMode === "add" ? "Save Entry" : "Update Entry"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, entry: open ? deleteConfirm.entry : null })}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete Time Entry</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this entry?
            </p>
            {deleteConfirm.entry && (
              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="font-medium">
                  {deleteConfirm.entry.description || <span className="italic text-muted-foreground">No description</span>}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDurationHuman(deleteConfirm.entry.duration_seconds)}
                  {deleteConfirm.entry.project?.name && ` • ${deleteConfirm.entry.project.name}`}
                </p>
              </div>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, entry: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Custom Date Range Modal */}
      <Dialog open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
        <DialogPopup className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Custom Date Range</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <Tabs value={customRangeTab} onValueChange={(v) => setCustomRangeTab(v as "start" | "end")}>
              <TabsList className="w-full">
                <TabsTab value="start" className="flex-1">Start Date</TabsTab>
                <TabsTab value="end" className="flex-1">End Date</TabsTab>
              </TabsList>
              <TabsPanel value="start" className="pt-4">
                <Input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setTempStartDate(newStart);
                    // If start date is after end date, set end date to start date
                    if (tempEndDate && newStart > tempEndDate) {
                      setTempEndDate(newStart);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {tempStartDate
                    ? new Date(tempStartDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a start date"}
                </p>
              </TabsPanel>
              <TabsPanel value="end" className="pt-4">
                <Input
                  type="date"
                  value={tempEndDate}
                  min={tempStartDate || undefined}
                  onChange={(e) => setTempEndDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {tempEndDate
                    ? new Date(tempEndDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select an end date"}
                </p>
              </TabsPanel>
            </Tabs>
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button variant="outline" onClick={() => setCustomRangeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (tempStartDate && tempEndDate) {
                  setCustomStartDate(tempStartDate);
                  setCustomEndDate(tempEndDate);
                  setDateRange("custom");
                  setCustomRangeOpen(false);
                }
              }}
              disabled={!tempStartDate || !tempEndDate}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Time Entries</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete these entries? This action cannot be undone.
            </p>
            {selectedEntries.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-muted p-3 space-y-2">
                {selectedEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="text-sm">
                    <p className="font-medium truncate">
                      {entry.description || <span className="italic text-muted-foreground">No description</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDurationHuman(entry.duration_seconds)}
                      {entry.project?.name && ` • ${entry.project.name}`}
                    </p>
                  </div>
                ))}
                {selectedEntries.length > 5 && (
                  <p className="text-xs text-muted-foreground">
                    ...and {selectedEntries.length - 5} more entries
                  </p>
                )}
              </div>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <Button
              variant="outline"
              onClick={() => setBulkDeleteConfirm(false)}
              disabled={isBulkActionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkActionLoading}
            >
              {isBulkActionLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                `Delete ${selectedIds.size} Entries`
              )}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
