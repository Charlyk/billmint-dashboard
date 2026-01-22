"use client";

import { useState } from "react";
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
import { ArrowLeft, Plus, X, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LineItem {
  id: string;
  description: string;
  quantity: string;
  rate: string;
  amount: number;
}

// Mock unbilled time entries
const unbilledEntries = [
  {
    id: "t1",
    description: "API Integration - ProjectX",
    project: "ProjectX",
    hours: 10,
    rate: 75,
    amount: 750,
  },
  {
    id: "t2",
    description: "Bug Fixes - ProjectX",
    project: "ProjectX",
    hours: 5,
    rate: 75,
    amount: 375,
  },
  {
    id: "t3",
    description: "Client Meetings",
    project: "ProjectX",
    hours: 2,
    rate: 75,
    amount: 150,
  },
  {
    id: "t4",
    description: "Design Review",
    project: "ProjectY",
    hours: 3,
    rate: 80,
    amount: 240,
  },
];

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}-${num}`;
}

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const today = new Date();

  const [client, setClient] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [issueDate, setIssueDate] = useState(formatDate(today));
  const [dueDate, setDueDate] = useState(formatDate(addDays(today, 15)));
  const [notes, setNotes] = useState(
    "Payment due within 15 days. Thank you for your business!"
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  const calculateItemAmount = (quantity: string, rate: string) => {
    const qty = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    return qty * r;
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = 0;
  const total = subtotal + tax;

  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: "",
      quantity: "",
      rate: "75.00",
      amount: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateLineItem = (
    id: string,
    field: keyof LineItem,
    value: string
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "rate") {
          updated.amount = calculateItemAmount(
            field === "quantity" ? value : item.quantity,
            field === "rate" ? value : item.rate
          );
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
    const newItems: LineItem[] = entriesToImport.map((entry) => ({
      id: `item-${Date.now()}-${entry.id}`,
      description: entry.description,
      quantity: `${entry.hours}h`,
      rate: entry.rate.toFixed(2),
      amount: entry.amount,
    }));
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

  const handleSaveDraft = () => {
    // TODO: Save draft to API
    router.push("/dashboard/invoices");
  };

  const handleSend = () => {
    // TODO: Send invoice via API
    router.push("/dashboard/invoices");
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
          <Button variant="outline" onClick={handleSaveDraft}>
            Save Draft
          </Button>
          <Button
            onClick={handleSend}
            className="bg-teal-500 hover:!bg-teal-600 border-teal-500"
            disabled={!client || lineItems.length === 0}
          >
            Send
          </Button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold">New Invoice</h1>

      {/* Invoice Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Client *</FieldLabel>
          <Select value={client} onValueChange={(value) => setClient(value || "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select client..." />
            </SelectTrigger>
            <SelectPopup>
              <SelectItem value="ClientName Inc.">ClientName Inc.</SelectItem>
              <SelectItem value="StartupXYZ">StartupXYZ</SelectItem>
              <SelectItem value="Legacy Corp">Legacy Corp</SelectItem>
            </SelectPopup>
          </Select>
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
            <div className="hidden border-b bg-muted/30 px-4 py-3 sm:grid sm:grid-cols-[1fr_80px_100px_100px_40px] sm:gap-4">
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
                    className="grid gap-2 p-4 sm:grid-cols-[1fr_80px_100px_100px_40px] sm:gap-4 sm:items-center"
                  >
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, "description", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, "quantity", e.target.value)
                      }
                      className="text-right"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) =>
                          handleUpdateLineItem(item.id, "rate", e.target.value)
                        }
                        className="text-right"
                      />
                    </div>
                    <div className="text-right font-medium tabular-nums">
                      ${item.amount.toFixed(2)}
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
                disabled={!client}
              >
                <Clock className="mr-1 size-4" />
                Import Unbilled Time
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="tabular-nums">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (0%):</span>
            <span className="tabular-nums">${tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span className="tabular-nums">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <Field>
        <FieldLabel>Notes (optional)</FieldLabel>
        <Textarea
          placeholder="Add any notes or payment instructions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </Field>

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
            <div className="space-y-2">
              {unbilledEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/30"
                >
                  <Checkbox
                    checked={selectedEntries.includes(entry.id)}
                    onCheckedChange={() => toggleEntrySelection(entry.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.project}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums">{entry.hours}h × ${entry.rate}</p>
                    <p className="text-sm font-medium tabular-nums">
                      ${entry.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
