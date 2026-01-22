import { logout } from '@/lib/services/auth.service'
import { handleError } from '@/lib/utils/errors'

export async function POST() {
  try {
    await logout()
    return Response.json({ data: { success: true } })
  } catch (error) {
    return handleError(error)
  }
}
