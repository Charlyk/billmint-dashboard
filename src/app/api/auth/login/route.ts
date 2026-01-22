import { NextRequest } from 'next/server'
import { login } from '@/lib/services/auth.service'
import { loginSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const result = await login(parsed.data.email, parsed.data.password)

    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}
