import { NextRequest } from 'next/server'
import { createCheckoutSession } from '@/lib/services/billing.service'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const { tier } = body

    if (!tier || !['pro', 'business'].includes(tier)) {
      throw new ValidationError('Invalid tier. Must be "pro" or "business"')
    }

    const session = await createCheckoutSession(tier)
    return Response.json({ data: session })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
