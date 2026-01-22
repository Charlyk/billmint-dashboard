import { NextRequest } from 'next/server'
import { getSettings, updateSettings } from '@/lib/services/user.service'
import { updateSettingsSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const settings = await getSettings()
    return Response.json({ data: settings })
  } catch (error) {
    return handleError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)

    if (!parsed.success) {
      throw new ValidationError('Invalid input', {
        ...parsed.error.flatten().fieldErrors,
      })
    }

    const settings = await updateSettings(parsed.data)
    return Response.json({ data: settings })
  } catch (error) {
    return handleError(error)
  }
}
