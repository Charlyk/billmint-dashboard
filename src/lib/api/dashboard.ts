import { fetcher } from './client'
import type { DashboardStats, RecentActivity } from '@/types/api'

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetcher<DashboardStats>('/api/dashboard/stats')
}

export async function getRecentActivity(
  limit?: number
): Promise<RecentActivity> {
  return fetcher<RecentActivity>('/api/dashboard/recent', {
    params: { limit },
  })
}
