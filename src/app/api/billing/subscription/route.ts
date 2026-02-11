import { getSubscription } from '@/lib/services/billing.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet() {
  try {
    const subscription = await getSubscription()
    return Response.json({ data: subscription })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet)
