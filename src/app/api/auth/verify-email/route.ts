import { NextRequest } from 'next/server'
import { verifyEmail, resendVerificationEmail, requireAuth } from '@/lib/services/auth.service'
import { verifyEmailSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

// POST - Verify email with token (public)
async function handlePost(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = verifyEmailSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const result = await verifyEmail(parsed.data.token)

    if (!result.success) {
      throw new ValidationError(result.message)
    }

    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}

// PUT - Resend verification email (requires auth)
async function handlePut() {
  try {
    const user = await requireAuth()
    const result = await resendVerificationEmail(user.id)

    if (!result.success) {
      throw new ValidationError(result.message)
    }

    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
export const PUT = withLogging(handlePut)
