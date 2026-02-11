import { NextRequest } from 'next/server'
import {
  getTimeEntryById,
  updateTimeEntry,
  deleteTimeEntry,
} from '@/lib/services/time-entry.service'
import { updateTimeEntrySchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet(
  request: NextRequest,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    if (!context) throw new Error('Missing params')
    const { id } = await context.params
    const entry = await getTimeEntryById(id)
    return Response.json({ data: entry })
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
    const parsed = updateTimeEntrySchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const entry = await updateTimeEntry(id, parsed.data)
    return Response.json({ data: entry })
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
    await deleteTimeEntry(id)
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet as any)
export const PATCH = withLogging(handlePatch as any)
export const DELETE = withLogging(handleDelete as any)
