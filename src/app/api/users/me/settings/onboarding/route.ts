import { dismissOnboarding } from '@/lib/services/user.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost() {
  try {
    const settings = await dismissOnboarding()
    return Response.json({ data: settings })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
