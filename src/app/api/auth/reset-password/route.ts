import { NextRequest } from 'next/server'
import { resetPassword, updatePasswordWithToken } from '@/lib/services/auth.service'
import { resetPasswordSchema, updatePasswordWithTokenSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    await resetPassword(parsed.data.email)

    // Always return success to prevent email enumeration
    return Response.json({
      data: { message: 'If an account exists, a reset link has been sent.' },
    })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updatePasswordWithTokenSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    await updatePasswordWithToken(parsed.data.token, parsed.data.password)

    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
