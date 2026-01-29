import { NextRequest } from 'next/server'
import { updateAppSettings } from '@/lib/services/user.service'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { z } from 'zod'

const updateAppSettingsSchema = z.object({
  time_format: z.enum(['12h', '24h']).optional(),
  week_starts_on: z.number().int().min(0).max(6).optional(),
  max_timer_hours: z.number().min(1).max(24).nullable().optional(),
  timezone: z.string().max(50).optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateAppSettingsSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const settings = await updateAppSettings(parsed.data)
    return Response.json({ data: settings })
  } catch (error) {
    return handleError(error)
  }
}
