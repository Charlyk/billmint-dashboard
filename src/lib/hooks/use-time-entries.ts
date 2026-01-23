'use client'

import useSWR from 'swr'
import { timeEntriesApi } from '@/lib/api'
import type {
  TimeEntryListResponse,
  TimeEntryWithDetails,
  UnbilledTimeEntriesResponse,
} from '@/types'
import type { TimeEntriesQuery } from '@/lib/utils/validation'

export function useTimeEntries(options?: TimeEntriesQuery) {
  const { data, error, isLoading, mutate } = useSWR<TimeEntryListResponse>(
    ['time-entries', options],
    () => timeEntriesApi.listTimeEntries(options)
  )

  return {
    entries: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useTimeEntry(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<TimeEntryWithDetails>(
    id ? ['time-entry', id] : null,
    () =>
      id
        ? timeEntriesApi.getTimeEntry(id)
        : Promise.resolve(null as unknown as TimeEntryWithDetails)
  )

  return {
    entry: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useUnbilledTimeEntries(clientId?: string) {
  const { data, error, isLoading, mutate } = useSWR<UnbilledTimeEntriesResponse>(
    ['unbilled-time-entries', clientId],
    () => timeEntriesApi.getUnbilledTimeEntries(clientId)
  )

  return {
    entries: data?.entries || [],
    totalHours: data?.total_hours || 0,
    totalAmount: data?.total_amount || 0,
    isLoading,
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
