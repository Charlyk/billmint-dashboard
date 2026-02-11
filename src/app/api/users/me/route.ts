import { NextRequest } from 'next/server'
import {
  getProfile,
  updateProfile,
  requestAccountDeletion,
  confirmAccountDeletion,
} from '@/lib/services/user.service'
import { updateProfileSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet() {
  try {
    const profile = await getProfile()
    return Response.json({ data: profile })
  } catch (error) {
    return handleError(error)
  }
}

async function handlePatch(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const user = await updateProfile(parsed.data)
    return Response.json({ data: user })
  } catch (error) {
    return handleError(error)
  }
}

// POST: Request account deletion (sends OTP email)
async function handlePost() {
  try {
    await requestAccountDeletion()
    return Response.json({ data: { message: 'Verification code sent to your email' } })
  } catch (error) {
    return handleError(error)
  }
}

// DELETE: Confirm account deletion with OTP
async function handleDelete(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const otpCode = searchParams.get('otp')

    if (!otpCode) {
      throw new ValidationError('Verification code is required')
    }

    await confirmAccountDeletion(otpCode)
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet)
export const PATCH = withLogging(handlePatch)
export const POST = withLogging(handlePost)
export const DELETE = withLogging(handleDelete)
