import { NextRequest } from 'next/server'
import {
  getTimeEntryById,
  updateTimeEntry,
  deleteTimeEntry,
} from '@/lib/services/time-entry.service'
import { updateTimeEntrySchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const entry = await getTimeEntryById(id)
    return Response.json({ data: entry })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await deleteTimeEntry(id)
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
