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
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useClients, useUnbilledTimeEntries, useInvoiceMutations, useInvoice } from "@/lib/hooks";
import { useUserSettings } from "@/contexts/user-settings-context";
import { toastManager } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils/currency";
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
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [invoiceCurrency, setInvoiceCurrency] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initializedAt, setInitializedAt] = useState<string | null>(null);
  const [entriesInitialized, setEntriesInitialized] = useState(false);

  // Fetch data
  const { clients, isLoading: clientsLoading } = useClients({ limit: 100 });
  const { entries: unbilledEntries, isLoading: entriesLoading } = useUnbilledTimeEntries(
    clientId || undefined
  );
  const { updateInvoice, sendInvoice } = useInvoiceMutations();

  // Initialize form with invoice data (re-initialize when invoice is updated)
  useEffect(() => {
    if (invoice && invoice.updated_at !== initializedAt) {
      setClientId(invoice.client_id);
      setInvoiceNumber(invoice.invoice_number);
      setIssueDate(formatDate(invoice.issue_date));
      setDueDate(formatDate(invoice.due_date));
      setNotes(invoice.notes || "");
      setTerms(invoice.terms || "");
      setTaxRate(invoice.tax_rate || 0);
      setDiscountAmount(invoice.discount_amount || 0);
      setInvoiceCurrency(invoice.currency);

      const existingItems = invoice.line_items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        rate: item.unit_price,
        amount: item.amount,
        time_entry_id: item.time_entry_id,
      }));

      setLineItems(existingItems);
      // Pre-select all existing items
      setSelectedItemIds(new Set(existingItems.map((item) => item.id)));
      setInitializedAt(invoice.updated_at);
      // Reset entries initialization so unbilled entries get merged again
      setEntriesInitialized(false);
    }
  }, [invoice, initializedAt]);

  // Merge unbilled entries with existing items when entries load
  useEffect(() => {
    if (!initializedAt || entriesInitialized || entriesLoading) return;

    // Get time_entry_ids that are already in the invoice
    const existingTimeEntryIds = new Set(
      lineItems.filter((item) => item.time_entry_id).map((item) => item.time_entry_id)
    );

    // Add unbilled entries that aren't already in the invoice
    const newItems: LineItem[] = unbilledEntries
      .filter((entry) => !existingTimeEntryIds.has(entry.id))
      .map((entry: TimeEntryWithDetails) => {
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

    if (newItems.length > 0) {
      setLineItems((prev) => [...prev, ...newItems]);
    }
    setEntriesInitialized(true);
  }, [initializedAt, entriesInitialized, entriesLoading, unbilledEntries, lineItems, settings?.default_hourly_rate]);

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

  // Calculate totals (only for selected items)
  const selectedItems = useMemo(() => {
    return lineItems.filter((item) => selectedItemIds.has(item.id));
  }, [lineItems, selectedItemIds]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.amount, 0);
  }, [selectedItems]);

  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount - discountAmount;

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === lineItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(lineItems.map((item) => item.id)));
    }
  };

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
    // Auto-select the new item
    setSelectedItemIds((prev) => new Set([...prev, newItem.id]));
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

  const handleSaveDraft = async () => {
    if (!clientId || selectedItems.length === 0) return;

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
        line_items: selectedItems.map((item) => ({
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
    if (!clientId || selectedItems.length === 0) return;

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
        line_items: selectedItems.map((item) => ({
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

  if (invoiceLoading || !initializedAt) {
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

      </div>

      {/* Line Items */}
      <div>
        <h2 className="mb-4 text-lg font-medium">Line Items</h2>
        <Card>
          <CardContent className="p-0">
            {/* Header */}
            <div className="hidden border-b bg-muted/30 px-4 py-3 lg:grid lg:grid-cols-[32px_1fr_80px_120px_120px] lg:gap-2 lg:items-center">
              <Checkbox
                checked={lineItems.length > 0 && selectedItemIds.size === lineItems.length}
                indeterminate={selectedItemIds.size > 0 && selectedItemIds.size < lineItems.length}
                onCheckedChange={toggleSelectAll}
                disabled={lineItems.length === 0}
              />
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
            </div>

            {/* Line Items */}
            {lineItems.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {entriesLoading ? "Loading time entries..." : "No billable time entries for this client."}
              </div>
            ) : (
              <div className="divide-y">
                {lineItems.map((item) => {
                  const isSelected = selectedItemIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`grid gap-2 p-4 lg:grid-cols-[32px_1fr_80px_120px_120px] lg:gap-2 lg:items-center ${!isSelected ? "opacity-50" : ""}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                      />
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
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t p-4">
              <Button variant="outline" size="sm" onClick={handleAddLineItem}>
                <Plus className="mr-1 size-4" />
                Add Line Item
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

    </div>
  );
}
