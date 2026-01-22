'use client'

import useSWR from 'swr'
import { invoicesApi } from '@/lib/api'
import { useAuthContext } from '@/contexts'
import type { InvoiceListResponse, InvoiceWithDetails } from '@/types'
import type { InvoicesQuery } from '@/lib/utils/validation'

export function useInvoices(options?: InvoicesQuery) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<InvoiceListResponse>(
    isAuthenticated ? ['invoices', options] : null,
    () => invoicesApi.listInvoices(options)
  )

  return {
    invoices: data?.data || [],
    pagination: data?.pagination,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useInvoice(id: string | null) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const { data, error, isLoading, mutate } = useSWR<InvoiceWithDetails>(
    isAuthenticated && id ? ['invoice', id] : null,
    () =>
      id
        ? invoicesApi.getInvoice(id)
        : Promise.resolve(null as unknown as InvoiceWithDetails)
  )

  return {
    invoice: data,
    isLoading: authLoading || isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useInvoiceMutations() {
  return {
    createInvoice: invoicesApi.createInvoice,
    updateInvoice: invoicesApi.updateInvoice,
    deleteInvoice: invoicesApi.deleteInvoice,
    sendInvoice: invoicesApi.sendInvoice,
    sendReminder: invoicesApi.sendReminder,
    markAsPaid: invoicesApi.markInvoiceAsPaid,
    voidInvoice: invoicesApi.voidInvoice,
  }
}
