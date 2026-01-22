import { getSubscription } from '@/lib/services/billing.service'
import { handleError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const subscription = await getSubscription()
    return Response.json({ data: subscription })
  } catch (error) {
    return handleError(error)
  }
}
