import { NextRequest } from 'next/server'
import { getPublicInvoice } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'
import { rateLimit } from '@/lib/utils/rate-limit'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(
  request: NextRequest,
  context?: { params: Promise<{ token: string }> }
) {
  const { success } = rateLimit(request, { limit: 30, windowMs: 60_000 })
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    if (!context) throw new Error('Missing params')
    const { token } = await context.params
    const invoice = await getPublicInvoice(token)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet as any)
