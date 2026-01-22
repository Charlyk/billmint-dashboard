import { signInWithGoogle } from '@/lib/services/auth.service'
import { handleError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const result = await signInWithGoogle()
    return Response.json({ data: result })
  } catch (error) {
    return handleError(error)
  }
}
