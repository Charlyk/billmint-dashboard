import { fetcher } from './client'
import type { DashboardStats, RecentActivity } from '@/types/api'

interface DashboardResponse {
  stats: DashboardStats
  recent_activity: RecentActivity
}

export async function getDashboardData(
  recentLimit?: number
): Promise<DashboardResponse> {
  return fetcher<DashboardResponse>('/api/dashboard', {
    params: { recent_limit: recentLimit },
  })
}
