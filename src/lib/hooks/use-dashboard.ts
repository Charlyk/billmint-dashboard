'use client'

import useSWR from 'swr'
import { dashboardApi } from '@/lib/api'
import type { DashboardStats, RecentActivity } from '@/types/api'

export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    'dashboard-stats',
    () => dashboardApi.getDashboardStats()
  )

  return {
    stats: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useRecentActivity(limit?: number) {
  const { data, error, isLoading, mutate } = useSWR<RecentActivity>(
    ['recent-activity', limit],
    () => dashboardApi.getRecentActivity(limit)
  )

  return {
    activity: data,
    entries: data?.entries || [],
    groupedByDate: data?.grouped_by_date || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}
