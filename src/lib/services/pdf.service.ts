import { renderToBuffer } from '@react-pdf/renderer'
import { InvoiceDocument } from '@/lib/pdf/invoice-template'
import type { InvoicePdfData } from '@/types/api'

/**
 * Generate a PDF buffer for an invoice
 * @param data Invoice data including invoice details, user info, and settings
 * @returns Buffer containing the PDF binary data
 */
export async function generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  const pdfBuffer = await renderToBuffer(
    InvoiceDocument({ data })
  )
  return Buffer.from(pdfBuffer)
}
