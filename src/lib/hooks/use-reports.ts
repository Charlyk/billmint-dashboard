'use client'

import useSWR from 'swr'
import { getReport, type ReportsQuery } from '@/lib/api/reports'
import type { TimeReport, TimeReportEntry } from '@/types/api'

export function useReport(query: ReportsQuery | null) {
  const { data, error, isLoading, mutate } = useSWR<TimeReport>(
    query ? ['report', query.start_date, query.end_date, query.project_id, query.client_id] : null,
    async () => {
      if (!query) return null as unknown as TimeReport
      return getReport(query)
    }
  )

  return {
    report: data,
    summary: data?.summary,
    byProject: data?.by_project || [],
    byClient: data?.by_client || [],
    byDay: data?.by_day || [],
    entries: (data?.entries || []) as TimeReportEntry[],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export type { ReportsQuery }
