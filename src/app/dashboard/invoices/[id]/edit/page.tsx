"use client";

import { useState, useMemo, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Plus, X, Clock, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useClients, useUnbilledTimeEntries, useInvoiceMutations, useInvoice } from "@/lib/hooks";
import { useUserSettings } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import { formatCurrency, currencyLocales } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import type { TimeEntryWithDetails } from "@/types";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  time_entry_id?: string | null;
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

function formatDuration(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(2);
}

const supportedCurrencies = Object.keys(currencyLocales);

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  CHF: "CHF",
  JPY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "MX$",
  PLN: "zł",
  RON: "lei",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  NZD: "NZ$",
  SGD: "S$",
  HKD: "HK$",
  ZAR: "R",
  AED: "د.إ",
};

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { settings, isLoading: settingsLoading } = useUserSettings();

  // Fetch existing invoice
  const { invoice, isLoading: invoiceLoading } = useInvoice(id);

  // Form state
  const [clientId, setClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [invoiceCurrency, setInvoiceCurrency] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Fetch data
  const { clients, isLoading: clientsLoading } = useClients({ limit: 100 });
  const { entries: unbilledEntries, isLoading: entriesLoading } = useUnbilledTimeEntries(
    clientId || undefined
  );
  const { updateInvoice, sendInvoice } = useInvoiceMutations();

  // Initialize form with invoice data
  useEffect(() => {
    if (invoice && !initialized) {
      setClientId(invoice.client_id);
      setInvoiceNumber(invoice.invoice_number);
      setIssueDate(formatDate(invoice.issue_date));
      setDueDate(formatDate(invoice.due_date));
      setNotes(invoice.notes || "");
      setTerms(invoice.terms || "");
      setTaxRate(invoice.tax_rate || 0);
      setDiscountAmount(invoice.discount_amount || 0);
      setInvoiceCurrency(invoice.currency);
      setLineItems(
        invoice.line_items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          rate: item.unit_price,
          amount: item.amount,
          time_entry_id: item.time_entry_id,
        }))
      );
      setInitialized(true);
    }
  }, [invoice, initialized]);

  // Redirect if invoice is not a draft
  useEffect(() => {
    if (invoice && invoice.status !== "draft") {
      toastManager.add({
        type: "error",
        title: "Cannot edit invoice",
        description: "Only draft invoices can be edited",
      });
      router.push("/dashboard/invoices");
    }
  }, [invoice, router]);

  // Get the selected client
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  const displayCurrency = invoiceCurrency || settings?.default_currency || "USD";

  // Calculate totals
  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0);
  }, [lineItems]);

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discountAmount;

  const handleAddLineItem = () => {
    const defaultRate = settings?.default_hourly_rate || 75;
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: defaultRate,
      amount: defaultRate,
      time_entry_id: null,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          const qty = field === "quantity" ? Number(value) : item.quantity;
          const rate = field === "rate" ? Number(value) : item.rate;
          updated.amount = Math.round(qty * rate * 100) / 100;
        }
        return updated;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Group entries by project
  const entriesByProject = useMemo(() => {
    const grouped: Record<string, { project: { id: string; name: string; currency: string } | null; entries: typeof unbilledEntries }> = {};
    unbilledEntries.forEach((entry) => {
      const projectId = entry.project?.id || "no-project";
      if (!grouped[projectId]) {
        grouped[projectId] = {
          project: entry.project ? { id: entry.project.id, name: entry.project.name, currency: entry.project.currency || "USD" } : null,
          entries: [],
        };
      }
      grouped[projectId].entries.push(entry);
    });
    return grouped;
  }, [unbilledEntries]);

  // Check if there are already line items (imported or manual)
  const hasLineItems = lineItems.length > 0;

  // For edit page, always use the invoice's existing currency as the constraint
  // since the invoice already has a defined currency
  const requiredCurrency = useMemo(() => {
    // If invoice has line items, use its currency
    if (hasLineItems) {
      return invoiceCurrency || settings?.default_currency || "USD";
    }
    // Otherwise, check the currently selected entries in the modal
    if (selectedEntries.length === 0) return null;
    const firstSelectedEntry = unbilledEntries.find((e) => selectedEntries.includes(e.id));
    return firstSelectedEntry?.project?.currency || settings?.default_currency || "USD";
  }, [hasLineItems, invoiceCurrency, selectedEntries, unbilledEntries, settings?.default_currency]);

  // Check if a project's currency matches the required currency
  const canSelectProject = (projectId: string) => {
    if (!requiredCurrency) return true;
    const projectCurrency = entriesByProject[projectId]?.project?.currency || settings?.default_currency || "USD";
    return projectCurrency === requiredCurrency;
  };

  const handleImportEntries = () => {
    const entriesToImport = unbilledEntries.filter((e) =>
      selectedEntries.includes(e.id)
    );

    // Set invoice currency from the first entry's project currency
    const firstEntry = entriesToImport[0];
    if (firstEntry?.project?.currency) {
      setInvoiceCurrency(firstEntry.project.currency);
    }

    const newItems: LineItem[] = entriesToImport.map((entry: TimeEntryWithDetails) => {
      const hours = Math.round((entry.duration_seconds / 3600) * 100) / 100;
      const rate = entry.hourly_rate || entry.project?.hourly_rate || settings?.default_hourly_rate || 75;
      return {
        id: `item-${Date.now()}-${entry.id}`,
        description: entry.description || `${entry.project?.name || "Work"} - ${formatDuration(entry.duration_seconds)}h`,
        quantity: hours,
        rate: rate,
        amount: Math.round(hours * rate * 100) / 100,
        time_entry_id: entry.id,
      };
    });
    setLineItems([...lineItems, ...newItems]);
    setSelectedEntries([]);
    setIsImportModalOpen(false);
  };

  const toggleEntrySelection = (entryId: string) => {
    const entry = unbilledEntries.find((e) => e.id === entryId);
    const entryCurrency = entry?.project?.currency || settings?.default_currency || "USD";

    // If already selected, always allow deselection
    if (selectedEntries.includes(entryId)) {
      setSelectedEntries((prev) => prev.filter((id) => id !== entryId));
      return;
    }

    // Check if currency matches before allowing selection
    if (!requiredCurrency || entryCurrency === requiredCurrency) {
      setSelectedEntries((prev) => [...prev, entryId]);
    }
  };

  const selectAllEntries = () => {
    if (selectedEntries.length === unbilledEntries.length) {
      setSelectedEntries([]);
    } else {
      // If we have a required currency (from existing imports), only select matching entries
      if (requiredCurrency) {
        const matchingEntries = unbilledEntries.filter(
          (e) => (e.project?.currency || settings?.default_currency || "USD") === requiredCurrency
        );
        setSelectedEntries(matchingEntries.map((e) => e.id));
      } else {
        // Otherwise, only select all if all entries have the same currency
        const currencies = new Set(unbilledEntries.map((e) => e.project?.currency || settings?.default_currency || "USD"));
        if (currencies.size === 1) {
          setSelectedEntries(unbilledEntries.map((e) => e.id));
        }
      }
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    const projectEntries = entriesByProject[projectId]?.entries || [];
    const projectEntryIds = projectEntries.map((e) => e.id);
    const allSelected = projectEntryIds.every((id) => selectedEntries.includes(id));

    if (allSelected) {
      setSelectedEntries((prev) => prev.filter((id) => !projectEntryIds.includes(id)));
    } else if (canSelectProject(projectId)) {
      setSelectedEntries((prev) => [...new Set([...prev, ...projectEntryIds])]);
    }
  };

  const handleSaveDraft = async () => {
    if (!clientId || lineItems.length === 0) return;

    setIsSaving(true);
    try {
      await updateInvoice(id, {
        invoice_number: invoiceNumber || undefined,
        issue_date: new Date(issueDate).toISOString(),
        due_date: new Date(dueDate).toISOString(),
        notes: notes || undefined,
        terms: terms || undefined,
        tax_rate: taxRate,
        discount_amount: discountAmount,
        line_items: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.rate,
          time_entry_id: item.time_entry_id,
        })),
      });

      toastManager.add({
        type: "success",
        title: "Invoice updated",
      });
      router.push("/dashboard/invoices");
    } catch (error) {
      console.error("Failed to update invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to update invoice",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    if (!clientId || lineItems.length === 0) return;

    if (!selectedClient?.email) {
      toastManager.add({
        type: "error",
        title: "Cannot send invoice",
        description: "Client does not have an email address",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateInvoice(id, {
        invoice_number: invoiceNumber || undefined,
        issue_date: new Date(issueDate).toISOString(),
        due_date: new Date(dueDate).toISOString(),
        notes: notes || undefined,
        terms: terms || undefined,
        tax_rate: taxRate,
        discount_amount: discountAmount,
        line_items: lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.rate,
          time_entry_id: item.time_entry_id,
        })),
      });

      await sendInvoice(id);

      toastManager.add({
        type: "success",
        title: "Invoice sent",
        description: `Invoice sent to ${selectedClient.email}`,
      });
      router.push("/dashboard/invoices");
    } catch (error) {
      console.error("Failed to send invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to send invoice",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (invoiceLoading || !initialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving || !clientId || lineItems.length === 0}>
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save Draft
          </Button>
          <Button
            onClick={handleSaveAndSend}
            className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
            disabled={isSaving || !clientId || lineItems.length === 0}
          >
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Save & Send
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold">Edit Invoice</h1>

      {/* Invoice Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Client</FieldLabel>
          <Select value={clientId} disabled>
            <SelectTrigger>
              <SelectValue>
                {selectedClient?.name || "Loading..."}
              </SelectValue>
            </SelectTrigger>
            <SelectPopup>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            Client cannot be changed after invoice creation
          </p>
        </Field>

        <Field>
          <FieldLabel>Invoice Number</FieldLabel>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="font-mono"
          />
        </Field>

        <Field>
          <FieldLabel>Issue Date</FieldLabel>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Due Date</FieldLabel>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Field>

        <Field>
          <FieldLabel>Currency</FieldLabel>
          <button
            type="button"
            onClick={() => setIsCurrencyModalOpen(true)}
            className="h-9 w-full px-3 text-sm font-medium border rounded-md hover:bg-accent/50 transition-colors text-left flex items-center justify-between"
          >
            <span>{currencySymbols[displayCurrency] || displayCurrency} {displayCurrency}</span>
            <span className="text-muted-foreground text-xs">Change</span>
          </button>
        </Field>
      </div>

      {/* Line Items */}
      <div>
        <h2 className="mb-4 text-lg font-medium">Line Items</h2>
        <Card>
          <CardContent className="p-0">
            {/* Header */}
            <div className="hidden border-b bg-muted/30 px-4 py-3 lg:grid lg:grid-cols-[1fr_80px_120px_120px_32px] lg:gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Description
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Qty
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Rate
              </span>
              <span className="text-right text-sm font-medium text-muted-foreground">
                Amount
              </span>
              <span></span>
            </div>

            {/* Line Items */}
            {lineItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No line items yet. Add items manually or import unbilled time.
              </div>
            ) : (
              <div className="divide-y">
                {lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 p-4 lg:grid-cols-[1fr_80px_120px_120px_32px] lg:gap-2 lg:items-center"
                  >
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, "description", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Qty"
                      value={item.quantity.toFixed(2)}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className="text-right"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Rate"
                      value={item.rate.toFixed(2)}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)
                      }
                      className="text-right"
                    />
                    <div className="text-right font-medium tabular-nums text-sm">
                      {formatCurrency(item.amount, displayCurrency, displayCurrency)}
                    </div>
                    <button
                      onClick={() => handleRemoveLineItem(item.id)}
                      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t p-4">
              <Button variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="mr-1 size-4" />
                Add Line Item
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                disabled={!clientId}
              >
                <Clock className="mr-1 size-4" />
                Import Unbilled Time
                {clientId && unbilledEntries.length > 0 && (
                  <span className="ml-1 rounded-full bg-teal-500 px-1.5 py-0.5 text-xs text-white">
                    {unbilledEntries.length}
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax & Discount */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Tax Rate (%)</FieldLabel>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field>
          <FieldLabel>Discount Amount ({displayCurrency})</FieldLabel>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
          />
        </Field>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="tabular-nums">{formatCurrency(subtotal, displayCurrency, displayCurrency)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxRate}%):</span>
              <span className="tabular-nums">{formatCurrency(taxAmount, displayCurrency, displayCurrency)}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount:</span>
              <span className="tabular-nums text-green-600">-{formatCurrency(discountAmount, displayCurrency, displayCurrency)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span className="tabular-nums">{formatCurrency(total, displayCurrency, displayCurrency)}</span>
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Notes (optional)</FieldLabel>
          <Textarea
            placeholder="Add any notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </Field>
        <Field>
          <FieldLabel>Terms (optional)</FieldLabel>
          <Textarea
            placeholder="Payment terms..."
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={3}
          />
        </Field>
      </div>

      {/* Currency Picker Modal */}
      <Dialog open={isCurrencyModalOpen} onOpenChange={setIsCurrencyModalOpen}>
        <DialogPopup className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Select Currency</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <div className="grid grid-cols-3 gap-2">
              {supportedCurrencies.map((curr) => {
                const isSelected = displayCurrency === curr;
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => {
                      setInvoiceCurrency(curr);
                      setIsCurrencyModalOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm transition-colors hover:bg-accent/50 ${
                      isSelected ? "border-teal-500 bg-teal-500/10" : ""
                    }`}
                  >
                    <span className="font-medium">{currencySymbols[curr] || curr}</span>
                    <span className="text-xs text-muted-foreground">{curr}</span>
                  </button>
                );
              })}
            </div>
          </DialogPanel>
        </DialogPopup>
      </Dialog>

      {/* Import Unbilled Time Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogPopup className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Unbilled Time</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <p className="mb-4 text-sm text-muted-foreground">
              {hasLineItems
                ? `Select time entries to add as line items. Only ${requiredCurrency} entries can be imported to match the invoice currency.`
                : "Select time entries to add as line items. The invoice currency will be set to the project's currency."}
            </p>
            {entriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : unbilledEntries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No unbilled time entries for this client.
              </div>
            ) : (
              <>
                {(() => {
                  const currencies = new Set(unbilledEntries.map((e) => e.project?.currency || settings?.default_currency || "USD"));
                  const hasMultipleCurrencies = currencies.size > 1;
                  const selectableEntries = requiredCurrency
                    ? unbilledEntries.filter((e) => (e.project?.currency || settings?.default_currency || "USD") === requiredCurrency)
                    : unbilledEntries;
                  const allSelectableSelected = selectableEntries.length > 0 && selectableEntries.every((e) => selectedEntries.includes(e.id));
                  return (
                    <div className="mb-3 flex items-center gap-2">
                      <Checkbox
                        checked={allSelectableSelected}
                        indeterminate={selectedEntries.length > 0 && !allSelectableSelected}
                        onCheckedChange={selectAllEntries}
                        disabled={hasMultipleCurrencies && !requiredCurrency && selectedEntries.length === 0}
                      />
                      <span className="text-sm font-medium">Select All</span>
                      {hasMultipleCurrencies && !requiredCurrency && selectedEntries.length === 0 && (
                        <span className="text-xs text-muted-foreground">(mixed currencies)</span>
                      )}
                      {requiredCurrency && hasMultipleCurrencies && (
                        <span className="text-xs text-muted-foreground">({requiredCurrency} only)</span>
                      )}
                    </div>
                  );
                })()}
                <div className="max-h-80 space-y-4 overflow-y-auto">
                  {Object.entries(entriesByProject).map(([projectId, { project, entries }]) => {
                    const projectCurrency = project?.currency || settings?.default_currency || "USD";
                    const projectEntryIds = entries.map((e) => e.id);
                    const allProjectSelected = projectEntryIds.every((id) => selectedEntries.includes(id));
                    const someProjectSelected = projectEntryIds.some((id) => selectedEntries.includes(id));
                    const isDisabled = !canSelectProject(projectId) && !someProjectSelected;

                    return (
                      <div key={projectId} className={cn("rounded-lg border", isDisabled && "opacity-50")}>
                        {/* Project Header */}
                        <div className="flex items-center gap-3 border-b bg-muted/30 px-3 py-2">
                          <Checkbox
                            checked={allProjectSelected}
                            indeterminate={someProjectSelected && !allProjectSelected}
                            onCheckedChange={() => toggleProjectSelection(projectId)}
                            disabled={isDisabled}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">
                              {project?.name || "No Project"}
                            </span>
                            {isDisabled && (
                              <p className="text-xs text-muted-foreground">Currency doesn&apos;t match</p>
                            )}
                          </div>
                          <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded">
                            {projectCurrency}
                          </span>
                        </div>

                        {/* Project Entries */}
                        <div className="divide-y">
                          {entries.map((entry) => {
                            const hours = entry.duration_seconds / 3600;
                            const rate = entry.hourly_rate || entry.project?.hourly_rate || settings?.default_hourly_rate || 75;
                            const amount = hours * rate;
                            return (
                              <div
                                key={entry.id}
                                className={cn("flex items-center gap-3 px-3 py-2", !isDisabled && "hover:bg-accent/30")}
                              >
                                <Checkbox
                                  checked={selectedEntries.includes(entry.id)}
                                  onCheckedChange={() => toggleEntrySelection(entry.id)}
                                  disabled={isDisabled}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">
                                    {entry.description || <span className="italic text-muted-foreground">No description</span>}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(entry.start_time).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm tabular-nums">
                                    {hours.toFixed(2)}h × {formatCurrency(rate, projectCurrency, projectCurrency)}
                                  </p>
                                  <p className="text-sm font-medium tabular-nums">
                                    {formatCurrency(amount, projectCurrency, projectCurrency)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleImportEntries}
              className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
              disabled={selectedEntries.length === 0}
            >
              Import Selected ({selectedEntries.length})
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
