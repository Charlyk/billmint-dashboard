import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { TimeEntry, UpdateTimeEntry } from '@/types/database'
import type {
  TimeEntryWithDetails,
  TimeEntryListResponse,
  UnbilledTimeEntriesResponse,
  TimeEntriesQuery,
} from '@/types/api'

export async function listTimeEntries(
  options?: TimeEntriesQuery
): Promise<TimeEntryListResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('list_time_entries', {
    p_user_id: currentUser.id,
    p_page: options?.page || 1,
    p_limit: options?.limit || 20,
    p_project_id: options?.project_id || null,
    p_client_id: options?.client_id || null,
    p_is_billable: options?.is_billable ?? null,
    p_is_invoiced: options?.is_invoiced ?? null,
    p_start_date: options?.start_date || null,
    p_end_date: options?.end_date || null,
    p_search: options?.search || null,
  }) as { data: TimeEntryListResponse | null; error: Error | null }

  if (error) {
    console.error('[TimeEntry] list_time_entries RPC error:', error)
    throw new ValidationError('Failed to fetch time entries')
  }

  if (!data) {
    return {
      data: [],
      pagination: {
        page: options?.page || 1,
        limit: options?.limit || 20,
        total: 0,
        totalPages: 0,
      },
    }
  }

  return data
}

export async function getTimeEntryById(id: string): Promise<TimeEntryWithDetails> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  interface EntryWithProject {
    id: string
    user_id: string
    project_id: string | null
    description: string | null
    start_time: string
    end_time: string | null
    duration_seconds: number
    hourly_rate: number | null
    is_billable: boolean
    is_invoiced: boolean
    invoice_id: string | null
    created_at: string
    updated_at: string
    project: {
      id: string
      name: string
      color: string | null
      hourly_rate: number | null
      currency: string
      client: { id: string; name: string } | null
    } | null
  }

  const { data, error } = await supabase
    .from('time_entries')
    .select(
      `
      *,
      project:projects(id, name, color, hourly_rate, currency, client:clients(id, name))
    `
    )
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: EntryWithProject | null; error: Error | null }

  if (error || !data) {
    throw new NotFoundError('Time entry')
  }

  const rate = data.hourly_rate || data.project?.hourly_rate || 0
  const amount = data.is_billable
    ? Math.round((data.duration_seconds / 3600) * rate * 100) / 100
    : 0

  return {
    ...data,
    client: data.project?.client || null,
    amount,
  } as unknown as TimeEntryWithDetails
}

export async function createTimeEntry(
  input: {
    start_time: string
    project_id?: string | null
    description?: string | null
    end_time?: string | null
    duration_seconds?: number | null
    is_billable?: boolean
    hourly_rate?: number | null
    notes?: string | null
  }
): Promise<TimeEntry> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_time_entry', {
    p_user_id: currentUser.id,
    p_start_time: input.start_time,
    p_project_id: input.project_id || null,
    p_description: input.description || null,
    p_end_time: input.end_time || null,
    p_duration_seconds: input.duration_seconds || null,
    p_is_billable: input.is_billable ?? true,
    p_hourly_rate: input.hourly_rate || null,
    p_notes: input.notes || null,
  }) as { data: TimeEntry | null; error: Error | null }

  if (error) {
    console.error('[TimeEntry] create_time_entry RPC error:', error)
    throw new ValidationError('Failed to create time entry')
  }

  if (!data) {
    throw new ValidationError('Failed to create time entry')
  }

  return data
}

export async function updateTimeEntry(
  id: string,
  input: UpdateTimeEntry
): Promise<TimeEntry> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Recalculate duration if times are being updated
  let durationSeconds = input.duration_seconds
  if (input.end_time || input.start_time) {
    const { data: existing } = await supabase
      .from('time_entries')
      .select('start_time, end_time')
      .eq('id', id)
      .single() as { data: { start_time: string; end_time: string | null } | null }

    if (existing) {
      const startTime = input.start_time || existing.start_time
      const endTime = input.end_time || existing.end_time

      if (startTime && endTime) {
        const start = new Date(startTime).getTime()
        const end = new Date(endTime).getTime()
        durationSeconds = Math.floor((end - start) / 1000)
      }
    }
  }

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      ...input,
      duration_seconds: durationSeconds,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .select()
    .single() as { data: TimeEntry | null; error: Error | null }

  if (error || !data) {
    throw new NotFoundError('Time entry')
  }

  return data
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Check if entry is invoiced
  const { data: entry } = await supabase
    .from('time_entries')
    .select('invoice_id')
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: { invoice_id: string | null } | null }

  if (entry?.invoice_id) {
    throw new ValidationError('Cannot delete an invoiced time entry')
  }

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id)

  if (error) {
    throw new ValidationError('Failed to delete time entry')
  }
}

export async function getUnbilledTimeEntries(
  clientId?: string
): Promise<UnbilledTimeEntriesResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_unbilled_time_entries', {
    p_user_id: currentUser.id,
    p_client_id: clientId || null,
  }) as { data: UnbilledTimeEntriesResponse | null; error: Error | null }

  if (error) {
    console.error('[TimeEntry] get_unbilled_time_entries RPC error:', error)
    throw new ValidationError('Failed to fetch unbilled time entries')
  }

  if (!data) {
    return {
      entries: [],
      total_hours: 0,
      total_amount: 0,
    }
  }

  return data
}

export async function markEntriesAsInvoiced(
  entryIds: string[],
  invoiceId: string
): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('time_entries')
    .update({
      invoice_id: invoiceId,
      updated_at: new Date().toISOString(),
    } as never)
    .in('id', entryIds)
    .eq('user_id', currentUser.id)

  if (error) {
    throw new ValidationError('Failed to mark entries as invoiced')
  }
}

export async function unmarkEntriesFromInvoice(
  invoiceId: string
): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('time_entries')
    .update({
      invoice_id: null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('invoice_id', invoiceId)
    .eq('user_id', currentUser.id)

  if (error) {
    throw new ValidationError('Failed to unmark entries from invoice')
  }
}
