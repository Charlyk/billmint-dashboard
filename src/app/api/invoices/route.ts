import { NextRequest } from 'next/server'
import { listInvoices, createInvoice } from '@/lib/services/invoice.service'
import { createInvoiceSchema, invoicesQuerySchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build options object, only including non-null values
    const rawOptions: Record<string, string | undefined> = {}
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const client_id = searchParams.get('client_id')
    const project_id = searchParams.get('project_id')
    const status = searchParams.get('status')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (page) rawOptions.page = page
    if (limit) rawOptions.limit = limit
    if (client_id) rawOptions.client_id = client_id
    if (project_id) rawOptions.project_id = project_id
    if (status) rawOptions.status = status
    if (start_date) rawOptions.start_date = start_date
    if (end_date) rawOptions.end_date = end_date

    const parsed = invoicesQuerySchema.safeParse(rawOptions)
    if (!parsed.success) {
      console.warn('[Invoices API] Query validation failed:', parsed.error.flatten())
    }
    const options = parsed.success ? parsed.data : { page: 1, limit: 20 }

    const invoices = await listInvoices(options)
    return Response.json({ data: invoices })
  } catch (error) {
    return handleError(error)
  }
}

async function handlePost(request: NextRequest) {
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

export const GET = withLogging(handleGet)
export const POST = withLogging(handlePost)
