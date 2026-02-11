import { getSession } from '@/lib/services/auth.service'
import { handleError } from '@/lib/utils/errors'
import { withLogging } from '@/lib/logging/route-handler'

async function handleGet() {
  try {
    const session = await getSession()
    return Response.json({ data: session })
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withLogging(handleGet)
