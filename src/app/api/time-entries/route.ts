import { NextRequest } from 'next/server'
import { listTimeEntries, createTimeEntry } from '@/lib/services/time-entry.service'
import { createTimeEntrySchema, timeEntriesQuerySchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = timeEntriesQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      project_id: searchParams.get('project_id'),
      client_id: searchParams.get('client_id'),
      is_billable: searchParams.get('is_billable'),
      is_invoiced: searchParams.get('is_invoiced'),
      start_date: searchParams.get('start_date'),
      end_date: searchParams.get('end_date'),
    })

    const options = parsed.success ? parsed.data : { page: 1, limit: 20 }
    const entries = await listTimeEntries(options)
    return Response.json({ data: entries })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = createTimeEntrySchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const entry = await createTimeEntry(parsed.data)
    return Response.json({ data: entry }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}
