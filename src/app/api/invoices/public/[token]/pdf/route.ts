import { NextRequest, NextResponse } from 'next/server'
import { getPublicInvoicePdfData } from '@/lib/services/invoice.service'
import { generateInvoicePdf } from '@/lib/services/pdf.service'
import { handleError } from '@/lib/utils/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Get public invoice data (validates token)
    const pdfData = await getPublicInvoicePdfData(token)

    // Generate PDF
    const pdfBuffer = await generateInvoicePdf(pdfData)

    // Return PDF with appropriate headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfData.invoice.invoice_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
