import { fetcher } from './client'
import type { Client, ClientWithStats, ClientListResponse } from '@/types'
import type { CreateClientInput, UpdateClientInput } from '@/lib/utils/validation'
import { analytics } from '@/lib/analytics/events'

export async function listClients(options?: {
  page?: number
  limit?: number
  includeArchived?: boolean
}): Promise<ClientListResponse> {
  return fetcher<ClientListResponse>('/api/clients', {
    params: {
      page: options?.page,
      limit: options?.limit,
      includeArchived: options?.includeArchived,
    },
  })
}

export async function getClient(id: string): Promise<ClientWithStats> {
  return fetcher<ClientWithStats>(`/api/clients/${id}`)
}

export async function createClient(data: CreateClientInput): Promise<Client> {
  const result = await fetcher<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  analytics.clientCreated()
  return result
}

export async function updateClient(
  id: string,
  data: UpdateClientInput
): Promise<Client> {
  const result = await fetcher<Client>(`/api/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  analytics.clientEdited({ client_id: result.id })
  return result
}

export async function deleteClient(id: string): Promise<void> {
  await fetcher(`/api/clients/${id}`, { method: 'DELETE' })
  analytics.clientDeleted({ client_id: id })
}
