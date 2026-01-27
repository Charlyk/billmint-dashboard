import { NextRequest } from 'next/server'
import { duplicateInvoice } from '@/lib/services/invoice.service'
import { handleError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const invoice = await duplicateInvoice(id)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}
