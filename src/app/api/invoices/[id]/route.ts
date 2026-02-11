import { NextRequest } from 'next/server'
import {
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
} from '@/lib/services/invoice.service'
import { updateInvoiceSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context) throw new Error('Missing params')
    const { id } = await context.params
    const invoice = await getInvoiceById(id)
    return Response.json({ data: invoice })
  } catch (error) {
    return handleError(error)
  }
}

async function handlePatch(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context) throw new Error('Missing params')
    const { id } = await context.params
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

async function handleDelete(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context) throw new Error('Missing params')
    const { id } = await context.params
    await deleteInvoice(id)
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet as any)
export const PATCH = withLogging(handlePatch as any)
export const DELETE = withLogging(handleDelete as any)
