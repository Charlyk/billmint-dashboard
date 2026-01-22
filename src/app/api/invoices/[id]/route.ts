import { NextRequest } from 'next/server'
import {
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from '@/lib/services/invoice.service'
import { updateInvoiceSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const invoice = await getInvoiceById(id)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = updateInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const invoice = await updateInvoice(id, parsed.data)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteInvoice(id)
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
