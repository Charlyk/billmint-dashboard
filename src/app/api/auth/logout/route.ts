import { logout } from '@/lib/services/auth.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handlePost() {
  try {
    await logout()
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}

export const POST = withLogging(handlePost)
