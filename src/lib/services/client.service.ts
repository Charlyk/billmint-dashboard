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
  total_invoiced: number
  outstanding_amount: number
}> {
  const supabase = await createSupabaseClient()

  // Get project count
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .eq('is_archived', false)

  // Get invoice totals
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total, status')
    .eq('client_id', clientId)
    .neq('status', 'void') as { data: { total: number; status: string }[] | null }

  const totalInvoiced = (invoices || []).reduce(
    (sum, inv) => sum + (inv.total || 0),
    0
  )

  const outstandingAmount = (invoices || [])
    .filter((inv) => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  return {
    project_count: projectCount || 0,
    total_invoiced: totalInvoiced,
    outstanding_amount: outstandingAmount,
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
