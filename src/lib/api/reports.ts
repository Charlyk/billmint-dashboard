import { fetcher } from './client'
import type { TimeReport } from '@/types/api'

export interface ReportsQuery {
  start_date: string
  end_date: string
  project_id?: string
  client_id?: string
}

export async function getReport(query: ReportsQuery): Promise<TimeReport> {
  return fetcher<TimeReport>('/api/reports', {
    params: {
      start_date: query.start_date,
      end_date: query.end_date,
      project_id: query.project_id,
      client_id: query.client_id,
    },
  })
}

export async function exportReport(
  query: ReportsQuery,
  format: 'csv' | 'json' = 'csv'
): Promise<Blob> {
  const params = new URLSearchParams({
    start_date: query.start_date,
    end_date: query.end_date,
    format,
  })

  if (query.project_id) {
    params.set('project_id', query.project_id)
  }
  if (query.client_id) {
    params.set('client_id', query.client_id)
  }

  const response = await fetch(`/api/reports/export?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to export report')
  }

  return response.blob()
}
