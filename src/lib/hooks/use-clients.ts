'use client'

import useSWR from 'swr'
import { clientsApi } from '@/lib/api'
import { useAuthContext } from '@/contexts'
import type { ClientListResponse, ClientWithStats } from '@/types'

export function useClients(options?: {
  page?: number
  limit?: number
  includeArchived?: boolean
}) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<ClientListResponse>(
    isAuthenticated ? ['clients', options] : null,
    () => clientsApi.listClients(options)
  )

  return {
    clients: data?.data || [],
    pagination: data?.pagination,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useClient(id: string | null) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<ClientWithStats>(
    isAuthenticated && id ? ['client', id] : null,
    () => (id ? clientsApi.getClient(id) : Promise.resolve(null as unknown as ClientWithStats))
  )

  return {
    client: data,
    isLoading: authLoading || isLoading,
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
