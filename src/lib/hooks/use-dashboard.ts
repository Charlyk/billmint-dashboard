'use client'

import useSWR from 'swr'
import { dashboardApi } from '@/lib/api'
import type { DashboardStats, RecentActivity } from '@/types/api'

interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity
}

export function useDashboard(recentLimit: number = 10) {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    ['dashboard', recentLimit],
    async () => {
      const response = await dashboardApi.getDashboardData(recentLimit)
      return {
        stats: response.stats,
        recentActivity: response.recent_activity,
      }
    }
  )

  return {
    stats: data?.stats,
    recentActivity: data?.recentActivity,
    entries: data?.recentActivity?.entries || [],
    groupedByDate: data?.recentActivity?.grouped_by_date || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}
