import { getActiveTimer, updateTimerDetails } from '@/lib/services/timer.service'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const timer = await getActiveTimer()
    return Response.json({ data: timer })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()

    const hasDescription = body.description !== undefined
    const hasProjectId = 'project_id' in body
    const hasBillable = body.is_billable !== undefined

    if (!hasDescription && !hasProjectId && !hasBillable) {
      throw new ValidationError('No fields to update')
    }

    const timer = await updateTimerDetails({
      description: body.description,
      project_id: body.project_id,
      is_billable: body.is_billable,
    })

    return Response.json({ data: timer })
  } catch (error) {
    return handleError(error)
  }
}
