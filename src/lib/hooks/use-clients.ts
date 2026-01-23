'use client'

import useSWR from 'swr'
import { clientsApi } from '@/lib/api'
import type { ClientListResponse, ClientWithStats } from '@/types'

export function useClients(options?: {
  page?: number
  limit?: number
  includeArchived?: boolean
}) {
  const { data, error, isLoading, mutate } = useSWR<ClientListResponse>(
    ['clients', options],
    () => clientsApi.listClients(options)
  )

  return {
    clients: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useClient(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ClientWithStats>(
    id ? ['client', id] : null,
    () => (id ? clientsApi.getClient(id) : Promise.resolve(null as unknown as ClientWithStats))
  )

  return {
    client: data,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useClientMutations() {
  return {
    createClient: clientsApi.createClient,
    updateClient: clientsApi.updateClient,
    deleteClient: clientsApi.deleteClient,
  }
}
