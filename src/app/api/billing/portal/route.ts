import { createPortalSession } from '@/lib/services/billing.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost() {
  try {
    const session = await createPortalSession()
    return Response.json({ data: session })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
