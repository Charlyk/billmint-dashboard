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

    if (!body.description && !body.project_id && body.is_billable === undefined) {
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
