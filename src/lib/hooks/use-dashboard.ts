'use client'

import useSWR from 'swr'
import { dashboardApi } from '@/lib/api'
import { useAuthContext } from '@/contexts'
import type { DashboardStats, RecentActivity } from '@/types/api'

export function useDashboardStats() {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    isAuthenticated ? 'dashboard-stats' : null,
    () => dashboardApi.getDashboardStats()
  )

  return {
    stats: data,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useRecentActivity(limit?: number) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<RecentActivity>(
    isAuthenticated ? ['recent-activity', limit] : null,
    () => dashboardApi.getRecentActivity(limit)
  )

  return {
    activity: data,
    entries: data?.entries || [],
    groupedByDate: data?.grouped_by_date || [],
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}
