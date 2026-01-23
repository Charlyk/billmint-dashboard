import { NextRequest } from 'next/server'
import { signup } from '@/lib/services/auth.service'
import { signupSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const result = await signup(
      parsed.data.email,
      parsed.data.password,
      parsed.data.full_name,
      parsed.data.timezone
    )

    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}
