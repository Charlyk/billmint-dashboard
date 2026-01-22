import { stopTimer } from '@/lib/services/timer.service'
import { handleError } from '@/lib/utils/errors'

export async function POST() {
  try {
    const result = await stopTimer()
    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}
