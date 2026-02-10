import { NextRequest } from 'next/server'
import { updateBillingDefaults } from '@/lib/services/user.service'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { z } from 'zod'

const updateBillingDefaultsSchema = z.object({
  default_currency: z.string().length(3).optional(),
  default_hourly_rate: z.number().min(0).optional(),
  billing_email: z.string().email().nullable().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateBillingDefaultsSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const settings = await updateBillingDefaults(parsed.data)
    return Response.json({ data: settings })
  } catch (error) {
    return handleError(error)
  }
}
