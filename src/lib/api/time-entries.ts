import { fetcher } from './client'
import type {
  TimeEntry,
  TimeEntryWithDetails,
  TimeEntryListResponse,
  UnbilledTimeEntriesResponse,
} from '@/types'
import type {
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  TimeEntriesQuery,
} from '@/lib/utils/validation'

export async function listTimeEntries(
  options?: TimeEntriesQuery
): Promise<TimeEntryListResponse> {
  return fetcher<TimeEntryListResponse>('/api/time-entries', {
    params: {
      page: options?.page,
      limit: options?.limit,
      project_id: options?.project_id,
      client_id: options?.client_id,
      is_billable: options?.is_billable,
      is_invoiced: options?.is_invoiced,
      start_date: options?.start_date,
      end_date: options?.end_date,
    },
  })
}

export async function getTimeEntry(id: string): Promise<TimeEntryWithDetails> {
  return fetcher<TimeEntryWithDetails>(`/api/time-entries/${id}`)
}

export async function createTimeEntry(
  data: CreateTimeEntryInput
): Promise<TimeEntry> {
  return fetcher<TimeEntry>('/api/time-entries', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTimeEntry(
  id: string,
  data: UpdateTimeEntryInput
): Promise<TimeEntry> {
  return fetcher<TimeEntry>(`/api/time-entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await fetcher(`/api/time-entries/${id}`, { method: 'DELETE' })
}

export async function getUnbilledTimeEntries(
  clientId?: string
): Promise<UnbilledTimeEntriesResponse> {
  return fetcher<UnbilledTimeEntriesResponse>('/api/time-entries/unbilled', {
    params: { clientId },
  })
}
