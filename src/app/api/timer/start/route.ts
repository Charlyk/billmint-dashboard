import { NextRequest } from 'next/server'
import { startTimer } from '@/lib/services/timer.service'
import { startTimerSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = startTimerSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const timer = await startTimer(parsed.data)
    return Response.json({ data: timer }, { status: 201 })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
