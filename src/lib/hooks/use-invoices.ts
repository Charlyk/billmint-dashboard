'use client'

import useSWR from 'swr'
import { invoicesApi } from '@/lib/api'
import type { InvoiceListResponse, InvoiceWithDetails } from '@/types'
import type { InvoicesQuery } from '@/lib/utils/validation'

export function useInvoices(options?: InvoicesQuery) {
  const { data, error, isLoading, mutate } = useSWR<InvoiceListResponse>(
    ['invoices', options],
    () => invoicesApi.listInvoices(options),
    { revalidateOnMount: true, dedupingInterval: 0 }
  )

  return {
    invoices: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useInvoice(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<InvoiceWithDetails>(
    id ? ['invoice', id] : null,
    () =>
      id
        ? invoicesApi.getInvoice(id)
        : Promise.resolve(null as unknown as InvoiceWithDetails)
  )

  return {
    invoice: data,
    isLoading,
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
