import { NextRequest } from 'next/server'
import {
  getProfile,
  updateProfile,
  deleteAccount,
} from '@/lib/services/user.service'
import { updateProfileSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const profile = await getProfile()
    return Response.json({ data: profile })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest) {
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

export async function DELETE() {
  try {
    await deleteAccount()
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
