import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Client, InsertClient, UpdateClient } from '@/types/database'
import type { ClientWithStats, ClientListResponse } from '@/types/api'

// Helper type for Supabase query results
type QueryResult<T> = { data: T | null; error: Error | null; count?: number | null }

export async function listClients(options?: {
  page?: number
  limit?: number
  includeArchived?: boolean
}): Promise<ClientListResponse> {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  const page = options?.page || 1
  const limit = options?.limit || 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('clients')
    .select('*', { count: 'exact' })
    .eq('user_id', currentUser.id)
    .order('name', { ascending: true })

  if (!options?.includeArchived) {
    query = query.eq('is_archived', false)
  }

  const result = await query.range(offset, offset + limit - 1) as { data: Client[] | null; error: Error | null; count: number | null }
  const { data, error, count } = result

  if (error) {
    throw new ValidationError('Failed to fetch clients')
  }

  // Get stats for each client
  const clientsWithStats = await Promise.all(
    (data || []).map(async (client) => {
      const stats = await getClientStats(client.id)
      return {
        ...client,
        ...stats,
      }
    })
  )

  return {
    data: clientsWithStats,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

export async function getClientById(id: string): Promise<ClientWithStats> {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: Client | null; error: Error | null }

  if (error || !data) {
    throw new NotFoundError('Client')
  }

  const stats = await getClientStats(id)

  return {
    ...data,
    ...stats,
  }
}

export async function createClient(
  input: Omit<InsertClient, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Client> {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...input,
      user_id: currentUser.id,
    } as never)
    .select()
    .single() as { data: Client | null; error: Error | null }

  if (error || !data) {
    throw new ValidationError('Failed to create client')
  }

  return data
}

export async function updateClient(
  id: string,
  input: UpdateClient
): Promise<Client> {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  const { data, error } = await supabase
    .from('clients')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .select()
    .single() as { data: Client | null; error: Error | null }

  if (error || !data) {
    throw new NotFoundError('Client')
  }

  return data
}

export async function deleteClient(id: string): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  // Check if client has any projects or invoices
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id)

  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', id)

  if ((projectCount || 0) > 0 || (invoiceCount || 0) > 0) {
    // Archive instead of delete
    await supabase
      .from('clients')
      .update({ is_archived: true, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('user_id', currentUser.id)
    return
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', currentUser.id)

  if (error) {
    throw new ValidationError('Failed to delete client')
  }
}

export async function archiveClient(id: string): Promise<Client> {
  return updateClient(id, { is_archived: true })
}

export async function unarchiveClient(id: string): Promise<Client> {
  return updateClient(id, { is_archived: false })
}

async function getClientStats(clientId: string): Promise<{
  project_count: number
  total_invoiced: { currency: string; amount: number }[]
  outstanding_amount: { currency: string; amount: number }[]
  unbilled_amount: { currency: string; amount: number }[]
}> {
  const supabase = await createSupabaseClient()

  // Get projects for this client with their currencies
  const { data: clientProjects } = await supabase
    .from('projects')
    .select('id, hourly_rate, currency')
    .eq('client_id', clientId)
    .eq('is_archived', false) as { data: { id: string; hourly_rate: number | null; currency: string }[] | null }

  const projectCount = clientProjects?.length || 0
  const projectIds = (clientProjects || []).map(p => p.id)

  // Get invoice totals grouped by currency
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, status, currency')
    .eq('client_id', clientId)
    .neq('status', 'void') as { data: { total: number; status: string; currency: string }[] | null }

  // Group invoiced amounts by currency
  const invoicedByCurrency = new Map<string, number>()
  const outstandingByCurrency = new Map<string, number>()

  for (const inv of invoices || []) {
    const currency = inv.currency || 'USD'
    invoicedByCurrency.set(currency, (invoicedByCurrency.get(currency) || 0) + (inv.total || 0))
    if (['sent', 'overdue'].includes(inv.status)) {
      outstandingByCurrency.set(currency, (outstandingByCurrency.get(currency) || 0) + (inv.total || 0))
    }
  }

  // Calculate unbilled amounts grouped by currency
  const unbilledByCurrency = new Map<string, number>()

  if (projectIds.length > 0) {
    const { data: unbilledEntries } = await supabase
      .from('time_entries')
      .select('duration_seconds, hourly_rate, project_id')
      .in('project_id', projectIds)
      .is('invoice_id', null)
      .eq('is_billable', true) as { data: { duration_seconds: number; hourly_rate: number | null; project_id: string }[] | null }

    // Create maps for project rates and currencies
    const projectRates = new Map(
      (clientProjects || []).map(p => [p.id, p.hourly_rate])
    )
    const projectCurrencies = new Map(
      (clientProjects || []).map(p => [p.id, p.currency || 'USD'])
    )

    for (const entry of unbilledEntries || []) {
      const rate = entry.hourly_rate ?? projectRates.get(entry.project_id) ?? 0
      const currency = projectCurrencies.get(entry.project_id) || 'USD'
      const hours = entry.duration_seconds / 3600
      const amount = hours * rate
      unbilledByCurrency.set(currency, (unbilledByCurrency.get(currency) || 0) + amount)
    }
  }

  // Convert maps to arrays
  const toAmountArray = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
      .filter(item => item.amount > 0)
      .sort((a, b) => a.currency.localeCompare(b.currency))

  return {
    project_count: projectCount,
    total_invoiced: toAmountArray(invoicedByCurrency),
    outstanding_amount: toAmountArray(outstandingByCurrency),
    unbilled_amount: toAmountArray(unbilledByCurrency),
  }
}

export async function getClientProjects(clientId: string) {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  // Verify client ownership
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', currentUser.id)
    .single()

  if (!client) {
    throw new NotFoundError('Client')
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_archived', false)
    .order('name')

  if (error) {
    throw new ValidationError('Failed to fetch client projects')
  }

  return data || []
}

export async function getClientInvoices(clientId: string) {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  // Verify client ownership
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('user_id', currentUser.id)
    .single()

  if (!client) {
    throw new NotFoundError('Client')
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', clientId)
    .order('issue_date', { ascending: false })

  if (error) {
    throw new ValidationError('Failed to fetch client invoices')
  }

  return data || []
}
