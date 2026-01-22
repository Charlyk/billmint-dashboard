import { getDashboardStats } from '@/lib/services/dashboard.service'
import { handleError } from '@/lib/utils/errors'

export async function GET() {
  try {
    const stats = await getDashboardStats()
    return Response.json({ data: stats })
  } catch (error) {
    return handleError(error)
  }
}
