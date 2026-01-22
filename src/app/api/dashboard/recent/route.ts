import { NextRequest } from 'next/server'
import { getRecentActivity } from '@/lib/services/dashboard.service'
import { handleError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)

    const activity = await getRecentActivity(limit)
    return Response.json({ data: activity })
  } catch (error) {
    return handleError(error)
  }
}
