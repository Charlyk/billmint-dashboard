import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Client, UpdateClient } from '@/types/database'
import type { ClientWithStats, ClientListResponse } from '@/types/api'

export async function listClients(options?: {
  page?: number
  limit?: number
  includeArchived?: boolean
  search?: string
}): Promise<ClientListResponse> {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('list_clients', {
    p_user_id: currentUser.id,
    p_page: options?.page || 1,
    p_limit: options?.limit || 20,
    p_include_archived: options?.includeArchived || false,
    p_search: options?.search || null,
  }) as { data: ClientListResponse | null; error: Error | null }

  if (error) {
    console.error('[Client] list_clients RPC error:', error)
    throw new ValidationError('Failed to fetch clients')
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

export async function getClientById(id: string): Promise<ClientWithStats> {
  const currentUser = await requireAuth()
  const supabase = await createSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_client_with_stats', {
    p_user_id: currentUser.id,
    p_client_id: id,
  }) as { data: ClientWithStats | null; error: Error | null }

  if (error) {
    console.error('[Client] get_client_with_stats RPC error:', error)
    throw new ValidationError('Failed to fetch client')
  }

  if (!data) {
    throw new NotFoundError('Client')
  }

  return data
}

export async function createClient(
  input: {
    name: string
    contact_name?: string | null
    email?: string | null
    phone?: string | null
    address?: string | null
    notes?: string | null
    currency?: string
  }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('delete_client', {
    p_user_id: currentUser.id,
    p_client_id: id,
  })

  if (error) {
    console.error('[Client] delete_client RPC error:', error)
    throw new ValidationError('Failed to delete client')
  }
}

export async function archiveClient(id: string): Promise<Client> {
  return updateClient(id, { is_archived: true })
}

export async function unarchiveClient(id: string): Promise<Client> {
  return updateClient(id, { is_archived: false })
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
