import { NextRequest } from 'next/server'
import { duplicateInvoice } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context) throw new Error('Missing params')
    const { id } = await context.params
    const invoice = await duplicateInvoice(id)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost as any)
