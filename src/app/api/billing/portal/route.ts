import { createPortalSession } from '@/lib/services/billing.service'
import { handleError } from '@/lib/utils/errors'

export async function POST() {
  try {
    const session = await createPortalSession()
    return Response.json({ data: session })
  } catch (error) {
    return handleError(error)
  }
}
