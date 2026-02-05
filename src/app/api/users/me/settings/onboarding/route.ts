import { dismissOnboarding } from '@/lib/services/user.service'
import { handleError } from '@/lib/utils/errors'

export async function POST() {
  try {
    const settings = await dismissOnboarding()
    return Response.json({ data: settings })
  } catch (error) {
    return handleError(error)
  }
}
