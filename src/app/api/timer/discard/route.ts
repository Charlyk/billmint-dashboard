import { discardTimer } from '@/lib/services/timer.service'
import { handleError } from '@/lib/utils/errors'

export async function POST() {
  try {
    await discardTimer()
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
