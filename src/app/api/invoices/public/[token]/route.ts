import { NextRequest } from 'next/server'
import { getPublicInvoice } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'
import { rateLimit } from '@/lib/utils/rate-limit'

type RouteParams = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { success } = rateLimit(request, { limit: 30, windowMs: 60_000 })
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { token } = await params
    const invoice = await getPublicInvoice(token)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}
