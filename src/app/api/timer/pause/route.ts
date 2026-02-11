import { pauseTimer } from '@/lib/services/timer.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost() {
  try {
    const timer = await pauseTimer()
    return Response.json({ data: timer })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
