import { NextRequest } from 'next/server'
import { getPublicInvoice } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ token: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params
    const invoice = await getPublicInvoice(token)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}
