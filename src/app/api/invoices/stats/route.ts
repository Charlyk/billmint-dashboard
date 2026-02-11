import { NextResponse } from 'next/server'
import { getInvoiceStats } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet() {
  try {
    const stats = await getInvoiceStats()
    return NextResponse.json({ data: stats })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet)
