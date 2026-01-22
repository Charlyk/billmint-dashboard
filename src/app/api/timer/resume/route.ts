import { resumeTimer } from '@/lib/services/timer.service'
import { handleError } from '@/lib/utils/errors'

export async function POST() {
  try {
    const timer = await resumeTimer()
    return Response.json({ data: timer })
  } catch (error) {
    return handleError(error)
  }
}
