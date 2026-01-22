'use client'

import useSWR from 'swr'
import { timeEntriesApi } from '@/lib/api'
import { useAuthContext } from '@/contexts'
import type {
  TimeEntryListResponse,
  TimeEntryWithDetails,
  UnbilledTimeEntriesResponse,
} from '@/types'
import type { TimeEntriesQuery } from '@/lib/utils/validation'

export function useTimeEntries(options?: TimeEntriesQuery) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<TimeEntryListResponse>(
    isAuthenticated ? ['time-entries', options] : null,
    () => timeEntriesApi.listTimeEntries(options)
  )

  return {
    entries: data?.data || [],
    pagination: data?.pagination,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useTimeEntry(id: string | null) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<TimeEntryWithDetails>(
    isAuthenticated && id ? ['time-entry', id] : null,
    () =>
      id
        ? timeEntriesApi.getTimeEntry(id)
        : Promise.resolve(null as unknown as TimeEntryWithDetails)
  )

  return {
    entry: data,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useUnbilledTimeEntries(clientId?: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<UnbilledTimeEntriesResponse>(
    isAuthenticated ? ['unbilled-time-entries', clientId] : null,
    () => timeEntriesApi.getUnbilledTimeEntries(clientId)
  )

  return {
    entries: data?.entries || [],
    totalHours: data?.total_hours || 0,
    totalAmount: data?.total_amount || 0,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useTimeEntryMutations() {
  return {
    createTimeEntry: timeEntriesApi.createTimeEntry,
    updateTimeEntry: timeEntriesApi.updateTimeEntry,
    deleteTimeEntry: timeEntriesApi.deleteTimeEntry,
  }
}
