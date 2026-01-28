import { fetcher } from './client'
import type {
  Invoice,
  InvoiceWithDetails,
  InvoiceListResponse,
  PublicInvoiceResponse,
} from '@/types'
import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoicesQuery,
} from '@/lib/utils/validation'

export async function listInvoices(
  options?: InvoicesQuery
): Promise<InvoiceListResponse> {
  return fetcher<InvoiceListResponse>('/api/invoices', {
    params: {
      page: options?.page,
      limit: options?.limit,
      client_id: options?.client_id,
      project_id: options?.project_id,
      status: options?.status,
      start_date: options?.start_date,
      end_date: options?.end_date,
    },
  })
}

export async function getInvoice(id: string): Promise<InvoiceWithDetails> {
  return fetcher<InvoiceWithDetails>(`/api/invoices/${id}`)
}

export async function createInvoice(
  data: CreateInvoiceInput
): Promise<InvoiceWithDetails> {
  return fetcher<InvoiceWithDetails>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateInvoice(
  id: string,
  data: UpdateInvoiceInput
): Promise<InvoiceWithDetails> {
  return fetcher<InvoiceWithDetails>(`/api/invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteInvoice(id: string): Promise<void> {
  await fetcher(`/api/invoices/${id}`, { method: 'DELETE' })
}

export async function sendInvoice(id: string): Promise<Invoice> {
  return fetcher<Invoice>(`/api/invoices/${id}/send`, { method: 'POST' })
}

export async function sendReminder(id: string): Promise<Invoice> {
  return fetcher<Invoice>(`/api/invoices/${id}/reminder`, { method: 'POST' })
}

export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
  return fetcher<Invoice>(`/api/invoices/${id}/mark-paid`, { method: 'POST' })
}

export async function voidInvoice(id: string): Promise<Invoice> {
  return fetcher<Invoice>(`/api/invoices/${id}/void`, { method: 'POST' })
}

export async function duplicateInvoice(id: string): Promise<InvoiceWithDetails> {
  return fetcher<InvoiceWithDetails>(`/api/invoices/${id}/duplicate`, { method: 'POST' })
}

export async function getPublicInvoice(
  token: string
): Promise<PublicInvoiceResponse> {
  return fetcher<PublicInvoiceResponse>(`/api/invoices/public/${token}`)
}

export async function downloadInvoicePdf(id: string): Promise<Blob> {
  const response = await fetch(`/api/invoices/${id}/pdf`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Failed to download PDF')
  }

  return response.blob()
}

export async function downloadPublicInvoicePdf(token: string): Promise<Blob> {
  const response = await fetch(`/api/invoices/public/${token}/pdf`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Failed to download PDF')
  }

  return response.blob()
}

export interface InvoiceStats {
  outstanding: {
    amounts: { currency: string; amount: number }[]
    count: number
  }
  overdue: {
    amounts: { currency: string; amount: number }[]
    count: number
  }
  paid_this_year: {
    amounts: { currency: string; amount: number }[]
    count: number
  }
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  return fetcher<InvoiceStats>('/api/invoices/stats')
}
