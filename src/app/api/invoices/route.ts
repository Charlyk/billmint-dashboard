import { NextRequest } from 'next/server'
import { listInvoices, createInvoice } from '@/lib/services/invoice.service'
import { createInvoiceSchema, invoicesQuerySchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = invoicesQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      client_id: searchParams.get('client_id'),
      status: searchParams.get('status'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
    })

    const options = parsed.success ? parsed.data : { page: 1, limit: 20 }
    const invoices = await listInvoices(options)
    return Response.json({ data: invoices })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createInvoiceSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const invoice = await createInvoice(parsed.data)
    return Response.json({ data: invoice }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
