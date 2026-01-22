import { NextRequest } from 'next/server'
import { syncTimer } from '@/lib/services/timer.service'
import { syncTimerSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = syncTimerSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const timer = await syncTimer(parsed.data)
    return Response.json({ data: timer })
  } catch (error) {
    return handleError(error)
  }
}
