import { getSession } from '@/lib/services/auth.service'
import { handleError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const session = await getSession()
    return Response.json({ data: session })
  } catch (error) {
    return handleError(error)
  }
}
