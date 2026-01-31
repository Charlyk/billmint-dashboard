import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { formatCurrencyForPdf, formatDateForPdf, formatQuantityForPdf, currencyLocales } from '@/lib/utils/pdf-formatters'
import type { InvoicePdfData } from '@/types/api'

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  companyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyEmail: {
    fontSize: 10,
    color: '#666666',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  addressSection: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  addressBlock: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 10,
    color: '#444444',
    lineHeight: 1.4,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  detailLabel: {
    fontSize: 10,
    color: '#666666',
    width: 80,
  },
  detailValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusDraft: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  statusSent: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  statusVoid: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
  },
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  colDescription: {
    flex: 3,
  },
  colQty: {
    width: 60,
    textAlign: 'right',
  },
  colRate: {
    width: 80,
    textAlign: 'right',
  },
  colAmount: {
    width: 90,
    textAlign: 'right',
  },
  cellText: {
    fontSize: 10,
  },
  cellTextBold: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalsSection: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    width: 200,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
    textAlign: 'right',
    paddingRight: 16,
  },
  totalValue: {
    fontSize: 10,
    width: 90,
    textAlign: 'right',
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginVertical: 8,
    width: 200,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: 200,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
    paddingRight: 16,
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 90,
    textAlign: 'right',
  },
  notesSection: {
    marginBottom: 30,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 10,
    color: '#444444',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  thankYou: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  branding: {
    fontSize: 9,
    color: '#0d9488',
  },
})

// Status badge style helper
function getStatusStyle(status: string) {
  switch (status) {
    case 'draft':
      return styles.statusDraft
    case 'sent':
      return styles.statusSent
    case 'paid':
      return styles.statusPaid
    case 'overdue':
      return styles.statusOverdue
    case 'void':
      return styles.statusVoid
    default:
      return styles.statusDraft
  }
}

// Invoice Header Component
function InvoiceHeader({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <View style={styles.header}>
      <View style={styles.companyInfo}>
        {logoUrl && <Image src={logoUrl} style={styles.logo} />}
      </View>
      <Text style={styles.invoiceTitle}>INVOICE</Text>
    </View>
  )
}

// Bill To Section Component
function BillToSection({
  user,
  client,
}: {
  user: InvoicePdfData['user']
  client: InvoicePdfData['invoice']['client']
}) {
  return (
    <View style={styles.addressSection}>
      <View style={styles.addressBlock}>
        <Text style={styles.addressLabel}>From</Text>
        <Text style={styles.addressName}>
          {user.company_name || user.full_name || 'Your Business'}
        </Text>
        <Text style={styles.addressText}>{user.email}</Text>
      </View>
      <View style={styles.addressBlock}>
        <Text style={styles.addressLabel}>Bill To</Text>
        <Text style={styles.addressName}>{client.name}</Text>
        {client.email && (
          <Text style={styles.addressText}>{client.email}</Text>
        )}
      </View>
    </View>
  )
}

// Invoice Details Component
function InvoiceDetails({
  invoice,
  settings,
}: {
  invoice: InvoicePdfData['invoice']
  settings: InvoicePdfData['settings']
}) {
  return (
    <View style={styles.detailsSection}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Invoice #:</Text>
        <Text style={styles.detailValue}>{invoice.invoice_number}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Issue Date:</Text>
        <Text style={styles.detailValue}>
          {formatDateForPdf(invoice.issue_date)}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Due Date:</Text>
        <Text style={styles.detailValue}>
          {formatDateForPdf(invoice.due_date)}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Status:</Text>
        <Text style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
          {invoice.status.toUpperCase()}
        </Text>
      </View>
    </View>
  )
}

// Line Items Table Component
function LineItemsTable({
  lineItems,
  currency,
  locale,
}: {
  lineItems: InvoicePdfData['invoice']['line_items']
  currency: string
  locale: string
}) {
  return (
    <View style={styles.table}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <View style={styles.colDescription}>
          <Text style={styles.tableHeaderText}>Description</Text>
        </View>
        <View style={styles.colQty}>
          <Text style={styles.tableHeaderText}>Qty</Text>
        </View>
        <View style={styles.colRate}>
          <Text style={styles.tableHeaderText}>Rate</Text>
        </View>
        <View style={styles.colAmount}>
          <Text style={styles.tableHeaderText}>Amount</Text>
        </View>
      </View>

      {/* Table Rows */}
      {lineItems.map((item, index) => (
        <View key={item.id || index} style={styles.tableRow}>
          <View style={styles.colDescription}>
            <Text style={styles.cellText}>{item.description}</Text>
          </View>
          <View style={styles.colQty}>
            <Text style={styles.cellText}>
              {formatQuantityForPdf(item.quantity, true)}
            </Text>
          </View>
          <View style={styles.colRate}>
            <Text style={styles.cellText}>
              {formatCurrencyForPdf(item.unit_price, currency, locale)}
            </Text>
          </View>
          <View style={styles.colAmount}>
            <Text style={styles.cellTextBold}>
              {formatCurrencyForPdf(item.amount, currency, locale)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

// Totals Section Component
function TotalsSection({
  invoice,
  locale,
}: {
  invoice: InvoicePdfData['invoice']
  locale: string
}) {
  const currency = invoice.currency
  const hasTax = invoice.tax_rate > 0 && invoice.tax_amount > 0
  const hasDiscount = invoice.discount_amount > 0

  return (
    <View style={styles.totalsSection}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal:</Text>
        <Text style={styles.totalValue}>
          {formatCurrencyForPdf(invoice.subtotal, currency, locale)}
        </Text>
      </View>

      {hasTax && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({invoice.tax_rate}%):</Text>
          <Text style={styles.totalValue}>
            {formatCurrencyForPdf(invoice.tax_amount, currency, locale)}
          </Text>
        </View>
      )}

      {hasDiscount && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount:</Text>
          <Text style={styles.totalValue}>
            -{formatCurrencyForPdf(invoice.discount_amount, currency, locale)}
          </Text>
        </View>
      )}

      <View style={styles.totalDivider} />

      <View style={styles.grandTotalRow}>
        <Text style={styles.grandTotalLabel}>Total:</Text>
        <Text style={styles.grandTotalValue}>
          {formatCurrencyForPdf(invoice.total, currency, locale)}
        </Text>
      </View>
    </View>
  )
}

// Notes Section Component
function NotesSection({
  notes,
  terms,
}: {
  notes?: string | null
  terms?: string | null
}) {
  if (!notes && !terms) return null

  return (
    <View style={styles.notesSection}>
      {notes && (
        <View style={{ marginBottom: terms ? 12 : 0 }}>
          <Text style={styles.notesLabel}>Notes</Text>
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      )}
      {terms && (
        <View>
          <Text style={styles.notesLabel}>Terms</Text>
          <Text style={styles.notesText}>{terms}</Text>
        </View>
      )}
    </View>
  )
}

// Footer Component
function Footer() {
  return (
    <View style={styles.footer}>
      <Text style={styles.thankYou}>Thank you for your business!</Text>
      <Text style={styles.branding}>Generated by BillMint.io</Text>
    </View>
  )
}

// Main Invoice Document Component
export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const { invoice, user, settings } = data
  // Use the user's default currency to determine locale for number formatting
  const locale = currencyLocales[settings.default_currency] || 'en-US'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <InvoiceHeader logoUrl={settings.logo_url} />
        <BillToSection user={user} client={invoice.client} />
        <InvoiceDetails invoice={invoice} settings={settings} />
        <LineItemsTable
          lineItems={invoice.line_items}
          currency={invoice.currency}
          locale={locale}
        />
        <TotalsSection invoice={invoice} locale={locale} />
        <NotesSection notes={invoice.notes} terms={invoice.terms} />
        <Footer />
      </Page>
    </Document>
  )
}
