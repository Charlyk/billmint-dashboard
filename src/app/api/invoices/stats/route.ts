import { NextResponse } from 'next/server'
import { getInvoiceStats } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const stats = await getInvoiceStats()
    return NextResponse.json({ data: stats })
  } catch (error) {
    return handleError(error)
  }
}
