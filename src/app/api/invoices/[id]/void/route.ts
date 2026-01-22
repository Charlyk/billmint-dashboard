import { NextRequest } from 'next/server'
import { voidInvoice } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const invoice = await voidInvoice(id)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}
