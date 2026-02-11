import { NextRequest } from 'next/server'
import { getSettings, updateSettings } from '@/lib/services/user.service'
import { updateSettingsSchema } from '@/lib/utils/validation'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet() {
  try {
    const settings = await getSettings()
    return Response.json({ data: settings })
  } catch (error) {
    return handleError(error)
  }
}

async function handlePatch(request: NextRequest) {
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

export const GET = withLogging(handleGet)
export const PATCH = withLogging(handlePatch)
