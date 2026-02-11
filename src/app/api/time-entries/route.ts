import { NextRequest } from 'next/server'
import { listTimeEntries, createTimeEntry } from '@/lib/services/time-entry.service'
import { createTimeEntrySchema, timeEntriesQuerySchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build options object, only including parameters that are actually provided
    const rawOptions: Record<string, string | null> = {}

    const paramKeys = [
      'page', 'limit', 'project_id', 'client_id',
      'is_billable', 'is_invoiced', 'start_date', 'end_date', 'search'
    ]

    for (const key of paramKeys) {
      const value = searchParams.get(key)
      if (value !== null) {
        rawOptions[key] = value
      }
    }

    const parsed = timeEntriesQuerySchema.safeParse(rawOptions)

    if (!parsed.success) {
      throw new ValidationError('Invalid query parameters', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const entries = await listTimeEntries(parsed.data)
    return Response.json({ data: entries })
  } catch (error) {
    return handleError(error)
  }
}

async function handlePost(request: NextRequest) {
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

export const GET = withLogging(handleGet)
export const POST = withLogging(handlePost)
