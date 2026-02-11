import { stopTimer } from '@/lib/services/timer.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost() {
  try {
    const result = await stopTimer()
    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
