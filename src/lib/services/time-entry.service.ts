import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { TimeEntry, InsertTimeEntry, UpdateTimeEntry } from '@/types/database'
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

  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('time_entries')
    .select(
      `
      *,
      project:projects(id, name, color, hourly_rate, currency, client_id, client:clients(id, name))
    `,
      { count: 'exact' }
    )
    .eq('user_id', currentUser.id)
    .order('start_time', { ascending: false })

  if (options?.project_id) {
    query = query.eq('project_id', options.project_id)
  }

  if (options?.is_billable !== undefined) {
    query = query.eq('is_billable', options.is_billable)
  }

  if (options?.is_invoiced !== undefined) {
    if (options.is_invoiced) {
      query = query.not('invoice_id', 'is', null)
    } else {
      query = query.is('invoice_id', null)
    }
  }

  if (options?.start_date) {
    query = query.gte('start_time', options.start_date)
  }

  if (options?.end_date) {
    query = query.lte('start_time', options.end_date)
  }

  if (options?.search) {
    query = query.ilike('description', `%${options.search}%`)
  }

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
      client_id: string | null
      client: { id: string; name: string } | null
    } | null
  }

  // For client_id filtering, we need to get all matching entries first
  // then filter and paginate manually (since Supabase doesn't support filtering on nested relations easily)
  if (options?.client_id) {
    // Fetch all entries matching other filters
    const allQuery = supabase
      .from('time_entries')
      .select(
        `
        *,
        project:projects(id, name, color, hourly_rate, currency, client_id, client:clients(id, name))
      `
      )
      .eq('user_id', currentUser.id)
      .order('start_time', { ascending: false })

    if (options?.project_id) {
      allQuery.eq('project_id', options.project_id)
    }
    if (options?.is_billable !== undefined) {
      allQuery.eq('is_billable', options.is_billable)
    }
    if (options?.is_invoiced !== undefined) {
      if (options.is_invoiced) {
        allQuery.not('invoice_id', 'is', null)
      } else {
        allQuery.is('invoice_id', null)
      }
    }
    if (options?.start_date) {
      allQuery.gte('start_time', options.start_date)
    }
    if (options?.end_date) {
      allQuery.lte('start_time', options.end_date)
    }
    if (options?.search) {
      allQuery.ilike('description', `%${options.search}%`)
    }

    const { data: allData, error: allError } = await allQuery as { data: EntryWithProject[] | null; error: Error | null }

    if (allError) {
      throw new ValidationError('Failed to fetch time entries')
    }

    // Filter by client_id
    const filteredEntries = (allData || []).filter(
      (entry) => entry.project?.client_id === options.client_id
    )

    // Manual pagination
    const total = filteredEntries.length
    const paginatedEntries = filteredEntries.slice(offset, offset + limit)

    const entriesWithDetails = paginatedEntries.map((entry) => {
      const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
      const amount = entry.is_billable
        ? Math.round((entry.duration_seconds / 3600) * rate * 100) / 100
        : 0

      return {
        ...entry,
        client: entry.project?.client || null,
        amount,
      }
    })

    return {
      data: entriesWithDetails as unknown as TimeEntryWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  const result = await query.range(offset, offset + limit - 1) as { data: EntryWithProject[] | null; error: Error | null; count: number | null }
  const { data, error, count } = result

  if (error) {
    throw new ValidationError('Failed to fetch time entries')
  }

  const entriesWithDetails = (data || []).map((entry) => {
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    const amount = entry.is_billable
      ? Math.round((entry.duration_seconds / 3600) * rate * 100) / 100
      : 0

    return {
      ...entry,
      client: entry.project?.client || null,
      amount,
    }
  })

  return {
    data: entriesWithDetails as unknown as TimeEntryWithDetails[],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
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
  input: Omit<InsertTimeEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<TimeEntry> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Calculate duration if end_time is provided
  let durationSeconds = input.duration_seconds || 0
  if (input.end_time && input.start_time) {
    const start = new Date(input.start_time).getTime()
    const end = new Date(input.end_time).getTime()
    durationSeconds = Math.floor((end - start) / 1000)
  }

  // Get hourly rate from project if not provided
  let hourlyRate = input.hourly_rate
  if (hourlyRate === undefined && input.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('hourly_rate')
      .eq('id', input.project_id)
      .single() as { data: { hourly_rate: number | null } | null }
    hourlyRate = project?.hourly_rate || null
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      ...input,
      user_id: currentUser.id,
      duration_seconds: durationSeconds,
      hourly_rate: hourlyRate,
    } as never)
    .select()
    .single() as { data: TimeEntry | null; error: Error | null }

  if (error || !data) {
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

  const query = supabase
    .from('time_entries')
    .select(
      `
      *,
      project:projects(id, name, color, hourly_rate, currency, client_id, client:clients(id, name))
    `
    )
    .eq('user_id', currentUser.id)
    .eq('is_billable', true)
    .is('invoice_id', null)
    .order('start_time', { ascending: false })

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
      client_id: string | null
      client: { id: string; name: string } | null
    } | null
  }

  const { data, error } = await query as { data: EntryWithProject[] | null; error: Error | null }

  if (error) {
    throw new ValidationError('Failed to fetch unbilled time entries')
  }

  // Filter by client if specified
  let entries = data || []
  if (clientId) {
    entries = entries.filter((e) => e.project?.client_id === clientId)
  }

  let totalHours = 0
  let totalAmount = 0

  const entriesWithDetails = entries.map((entry) => {
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    const hours = entry.duration_seconds / 3600
    const amount = Math.round(hours * rate * 100) / 100

    totalHours += hours
    totalAmount += amount

    return {
      ...entry,
      client: entry.project?.client || null,
      amount,
    }
  })

  return {
    entries: entriesWithDetails as unknown as TimeEntryWithDetails[],
    total_hours: Math.round(totalHours * 100) / 100,
    total_amount: Math.round(totalAmount * 100) / 100,
  }
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
