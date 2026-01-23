import { NextRequest } from 'next/server'
import { getDashboardData } from '@/lib/services/dashboard.service'
import { handleError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const recentLimit = parseInt(searchParams.get('recent_limit') || '10', 10)

    const data = await getDashboardData(recentLimit)

    return Response.json({
      data: {
        stats: data.stats,
        recent_activity: data.recentActivity,
      },
    })
  } catch (error) {
    return handleError(error)
  }
}
