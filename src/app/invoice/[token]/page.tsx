import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";

// Mock invoice data - in production this would be fetched by token
const mockInvoice = {
  number: "INV-2026-0012",
  issueDate: "January 15, 2026",
  dueDate: "January 30, 2026",
  status: "sent",
  from: {
    name: "Your Name",
    email: "your@email.com",
    address: "123 Your Street\nCity, State 12345",
  },
  to: {
    name: "ClientName Inc.",
    email: "john@clientname.com",
    address: "456 Client Street\nCity, State 67890",
  },
  lineItems: [
    {
      id: "1",
      description: "API Integration - ProjectX",
      quantity: "10h",
      rate: 75.0,
      amount: 750.0,
    },
    {
      id: "2",
      description: "Bug Fixes - ProjectX",
      quantity: "5h",
      rate: 75.0,
      amount: 375.0,
    },
    {
      id: "3",
      description: "Client Meetings",
      quantity: "2h",
      rate: 75.0,
      amount: 150.0,
    },
  ],
  subtotal: 1275.0,
  total: 1275.0,
  notes: "Payment due within 15 days. Thank you for your business!",
};

export default async function InvoicePublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // TODO: Fetch invoice by token from API
  // const invoice = await getInvoiceByToken(token);
  const invoice = mockInvoice;

  const handleDownloadPDF = () => {
    // TODO: Generate and download PDF
    console.log("Download PDF for token:", token);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-3xl px-4">
        <Card className="overflow-hidden">
          <CardContent className="p-8 sm:p-12">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold tracking-tight">INVOICE</h1>
            </div>

            {/* From / To */}
            <div className="mb-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  From:
                </p>
                <p className="font-medium">{invoice.from.name}</p>
                <p className="text-sm text-muted-foreground">
                  {invoice.from.email}
                </p>
                {invoice.from.address && (
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {invoice.from.address}
                  </p>
                )}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  To:
                </p>
                <p className="font-medium">{invoice.to.name}</p>
                {invoice.to.email && (
                  <p className="text-sm text-muted-foreground">
                    {invoice.to.email}
                  </p>
                )}
                {invoice.to.address && (
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {invoice.to.address}
                  </p>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="mb-8 space-y-1">
              <p>
                <span className="text-muted-foreground">Invoice:</span>{" "}
                <span className="font-mono font-medium">{invoice.number}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Issue Date:</span>{" "}
                {invoice.issueDate}
              </p>
              <p>
                <span className="text-muted-foreground">Due Date:</span>{" "}
                {invoice.dueDate}
              </p>
            </div>

            {/* Line Items Table */}
            <div className="mb-8 overflow-hidden rounded-lg border">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_60px_80px_100px] gap-4 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
              </div>

              {/* Table Body */}
              <div className="divide-y">
                {invoice.lineItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_60px_80px_100px] gap-4 px-4 py-3 text-sm"
                  >
                    <span>{item.description}</span>
                    <span className="text-right tabular-nums">
                      {item.quantity}
                    </span>
                    <span className="text-right tabular-nums">
                      ${item.rate.toFixed(2)}
                    </span>
                    <span className="text-right font-medium tabular-nums">
                      ${item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t bg-muted/30">
                <div className="grid grid-cols-[1fr_100px] gap-4 px-4 py-2 text-sm">
                  <span className="text-right text-muted-foreground">
                    Subtotal:
                  </span>
                  <span className="text-right tabular-nums">
                    ${invoice.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_100px] gap-4 border-t px-4 py-3 font-medium">
                  <span className="text-right">Total Due:</span>
                  <span className="text-right tabular-nums">
                    ${invoice.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mb-8">
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Notes:
                </p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}

            {/* Download Button */}
            <div className="text-center">
              <Button variant="outline" onClick={handleDownloadPDF}>
                <Download className="mr-2 size-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <span className="font-medium text-teal-600">BillMint.io</span>
          </p>
        </div>
      </div>
    </div>
  );
}
