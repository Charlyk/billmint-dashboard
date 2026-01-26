"use client";

import { useState, useMemo, useEffect } from "react";
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
import { useClients, useUnbilledTimeEntries, useInvoiceMutations } from "@/lib/hooks";
import { useUserSettings } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import type { TimeEntryWithDetails } from "@/types";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  currency: string;
  time_entry_id?: string | null;
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDuration(seconds: number): string {
  const hours = seconds / 3600;
  return hours.toFixed(2);
}

// Currency formatting
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

const supportedCurrencies = Object.keys(currencyLocales);

// Currency symbols for display
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

export default function NewInvoicePage() {
  const router = useRouter();
  const today = new Date();
  const { settings, isLoading: settingsLoading } = useUserSettings();

  // Form state
  const [clientId, setClientId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(formatDate(today));
  const [dueDate, setDueDate] = useState(formatDate(addDays(today, 15)));
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [currencyModalItem, setCurrencyModalItem] = useState<string | null>(null);

  // Fetch data
  const { clients, isLoading: clientsLoading } = useClients({ limit: 100 });
  const { entries: unbilledEntries, isLoading: entriesLoading } = useUnbilledTimeEntries(
    clientId || undefined
  );
  const { createInvoice, sendInvoice } = useInvoiceMutations();

  // Initialize defaults from user settings
  useEffect(() => {
    if (settings && !settingsLoading) {
      // Generate invoice number with prefix
      const prefix = settings.invoice_prefix || "INV";
      const year = new Date().getFullYear();
      const num = Math.floor(Math.random() * 9000) + 1000;
      setInvoiceNumber(`${prefix}-${year}-${num}`);

      // Set default notes and terms
      if (settings.invoice_notes) {
        setNotes(settings.invoice_notes);
      }
      if (settings.invoice_terms) {
        setTerms(settings.invoice_terms);
      }
    }
  }, [settings, settingsLoading]);

  // Get the selected client
  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  );

  const displayCurrency = settings?.default_currency || "USD";

  // Calculate totals grouped by currency
  const totalsByCurrency = useMemo(() => {
    const grouped: Record<string, number> = {};
    lineItems.forEach((item) => {
      grouped[item.currency] = (grouped[item.currency] || 0) + item.amount;
    });
    return grouped;
  }, [lineItems]);

  const currencies = Object.keys(totalsByCurrency);
  const isSingleCurrency = currencies.length <= 1;
  const primaryCurrency = currencies[0] || displayCurrency;

  // For single currency invoices, calculate tax and discount
  const subtotal = isSingleCurrency ? totalsByCurrency[primaryCurrency] || 0 : 0;
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
      currency: displayCurrency,
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

  const handleImportEntries = () => {
    const entriesToImport = unbilledEntries.filter((e) =>
      selectedEntries.includes(e.id)
    );

    const newItems: LineItem[] = entriesToImport.map((entry: TimeEntryWithDetails) => {
      const hours = Math.round((entry.duration_seconds / 3600) * 100) / 100;
      const rate = entry.hourly_rate || entry.project?.hourly_rate || settings?.default_hourly_rate || 75;
      const entryCurrency = entry.project?.currency || settings?.default_currency || "USD";
      return {
        id: `item-${Date.now()}-${entry.id}`,
        description: entry.description || `${entry.project?.name || "Work"} - ${formatDuration(entry.duration_seconds)}h`,
        quantity: hours,
        rate: rate,
        amount: Math.round(hours * rate * 100) / 100,
        currency: entryCurrency,
        time_entry_id: entry.id,
      };
    });
    setLineItems([...lineItems, ...newItems]);
    setSelectedEntries([]);
    setIsImportModalOpen(false);
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntries((prev) =>
      prev.includes(entryId)
        ? prev.filter((id) => id !== entryId)
        : [...prev, entryId]
    );
  };

  const selectAllEntries = () => {
    if (selectedEntries.length === unbilledEntries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(unbilledEntries.map((e) => e.id));
    }
  };

  const handleSaveDraft = async () => {
    if (!clientId || lineItems.length === 0) return;

    setIsSaving(true);
    try {
      await createInvoice({
        client_id: clientId,
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
        title: "Invoice saved as draft",
      });
      router.push("/dashboard/invoices");
    } catch (error) {
      console.error("Failed to save invoice:", error);
      toastManager.add({
        type: "error",
        title: "Failed to save invoice",
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
      // First create the invoice
      const invoice = await createInvoice({
        client_id: clientId,
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

      // Then send it
      await sendInvoice(invoice.id);

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

      <h1 className="text-2xl font-semibold">New Invoice</h1>

      {/* Invoice Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Client *</FieldLabel>
          <Select value={clientId} onValueChange={(value) => {
              setClientId(value || "");
              // Reset line items when client changes
              setLineItems([]);
            }}>
            <SelectTrigger>
              <SelectValue placeholder={clientsLoading ? "Loading..." : "Select client..."}>
                {selectedClient?.name}
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
          {selectedClient && !selectedClient.email && (
            <p className="mt-1 text-xs text-amber-600">
              Warning: This client has no email address. You can save as draft but cannot send.
            </p>
          )}
        </Field>

        <Field>
          <FieldLabel>Invoice Number</FieldLabel>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="font-mono"
            placeholder="Auto-generated"
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
      </div>

      {/* Line Items */}
      <div>
        <h2 className="mb-4 text-lg font-medium">Line Items</h2>
        <Card>
          <CardContent className="p-0">
            {/* Header */}
            <div className="hidden border-b bg-muted/30 px-4 py-3 lg:grid lg:grid-cols-[1fr_70px_70px_100px_110px_32px] lg:gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Description
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Qty
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Curr.
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
                    className="grid gap-2 p-4 lg:grid-cols-[1fr_70px_70px_100px_110px_32px] lg:gap-2 lg:items-center"
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
                    <button
                      type="button"
                      onClick={() => setCurrencyModalItem(item.id)}
                      className="h-9 px-2 text-sm font-medium border rounded-md hover:bg-accent/50 transition-colors min-w-[50px]"
                      title={item.currency}
                    >
                      {currencySymbols[item.currency] || item.currency}
                    </button>
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
                      {formatCurrency(item.amount, item.currency)}
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
          {isSingleCurrency ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="tabular-nums">{formatCurrency(subtotal, primaryCurrency)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                  <span className="tabular-nums">{formatCurrency(taxAmount, primaryCurrency)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="tabular-nums text-green-600">-{formatCurrency(discountAmount, primaryCurrency)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span className="tabular-nums">{formatCurrency(total, primaryCurrency)}</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">Subtotals by currency:</p>
              {currencies.map((curr) => (
                <div key={curr} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{curr}:</span>
                  <span className="tabular-nums">{formatCurrency(totalsByCurrency[curr], curr)}</span>
                </div>
              ))}
              {(taxRate > 0 || discountAmount > 0) && (
                <p className="text-xs text-amber-600 mt-2">
                  Tax and discount only apply to single-currency invoices.
                </p>
              )}
            </>
          )}
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
      <Dialog open={!!currencyModalItem} onOpenChange={(open) => !open && setCurrencyModalItem(null)}>
        <DialogPopup className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Select Currency</DialogTitle>
          </DialogHeader>
          <DialogPanel>
            <div className="grid grid-cols-3 gap-2">
              {supportedCurrencies.map((curr) => {
                const currentItem = lineItems.find((i) => i.id === currencyModalItem);
                const isSelected = currentItem?.currency === curr;
                return (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => {
                      if (currencyModalItem) {
                        handleUpdateLineItem(currencyModalItem, "currency", curr);
                      }
                      setCurrencyModalItem(null);
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
              Select time entries to add as line items to this invoice.
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
                <div className="mb-3 flex items-center gap-2">
                  <Checkbox
                    checked={selectedEntries.length === unbilledEntries.length}
                    indeterminate={selectedEntries.length > 0 && selectedEntries.length < unbilledEntries.length}
                    onCheckedChange={selectAllEntries}
                  />
                  <span className="text-sm font-medium">Select All</span>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {unbilledEntries.map((entry) => {
                    const hours = entry.duration_seconds / 3600;
                    const rate = entry.hourly_rate || entry.project?.hourly_rate || settings?.default_hourly_rate || 75;
                    const amount = hours * rate;
                    const entryCurrency = entry.project?.currency || displayCurrency;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/30"
                      >
                        <Checkbox
                          checked={selectedEntries.includes(entry.id)}
                          onCheckedChange={() => toggleEntrySelection(entry.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {entry.description || <span className="italic text-muted-foreground">No description</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.project?.name || "No project"} • {new Date(entry.start_time).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm tabular-nums">{hours.toFixed(2)}h × {formatCurrency(rate, entryCurrency)}</p>
                          <p className="text-sm font-medium tabular-nums">
                            {formatCurrency(amount, entryCurrency)}
                          </p>
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
