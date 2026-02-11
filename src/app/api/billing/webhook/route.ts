import { NextRequest } from 'next/server'
import { handleWebhook } from '@/lib/services/billing.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return Response.json(
        { error: { message: 'Missing stripe-signature header' } },
        { status: 400 }
      )
    }

    await handleWebhook(body, signature)
    return Response.json({ received: true })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
