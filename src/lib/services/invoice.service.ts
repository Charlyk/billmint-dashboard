import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Invoice } from '@/types/database'
import type {
  InvoiceWithDetails,
  InvoiceListResponse,
  PublicInvoiceResponse,
  InvoicesQuery,
  InvoiceLineItemInput,
  InvoicePdfData,
} from '@/types/api'
import { sendInvoiceSentEmail, sendInvoiceReminderEmail } from './email.service'

export async function listInvoices(
  options?: InvoicesQuery
): Promise<InvoiceListResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const page = options?.page || 1
  const limit = options?.limit || 20

  const params = {
    p_user_id: currentUser.id,
    p_page: page,
    p_limit: limit,
    p_client_id: options?.client_id || null,
    p_project_id: options?.project_id || null,
    p_status: options?.status || null,
    p_start_date: options?.start_date || null,
    p_end_date: options?.end_date || null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('list_invoices', params)

  if (error) {
    console.error('[Invoice] list_invoices RPC error:', error.message, error.details, error.hint)
    throw new ValidationError('Failed to fetch invoices')
  }

  // RPC returns the result directly as JSON
  return data || {
    data: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
  }
}

export async function getInvoiceById(id: string): Promise<InvoiceWithDetails> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_invoice_with_details', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
  }) as { data: InvoiceWithDetails | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    console.error('[Invoice] get_invoice_with_details RPC error:', error)
    throw new ValidationError('Failed to fetch invoice')
  }

  if (!data) {
    throw new NotFoundError('Invoice')
  }

  return data
}

export async function createInvoice(input: {
  client_id: string
  invoice_number?: string
  issue_date?: string
  due_date: string
  notes?: string
  terms?: string
  tax_rate?: number
  discount_amount?: number
  line_items: InvoiceLineItemInput[]
}): Promise<InvoiceWithDetails> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('create_invoice', {
    p_user_id: currentUser.id,
    p_client_id: input.client_id,
    p_invoice_number: input.invoice_number || null,
    p_issue_date: input.issue_date || new Date().toISOString(),
    p_due_date: input.due_date,
    p_notes: input.notes || null,
    p_terms: input.terms || null,
    p_tax_rate: input.tax_rate || 0,
    p_discount_amount: input.discount_amount || 0,
    p_line_items: input.line_items,
  }) as { data: InvoiceWithDetails | null; error: Error | null }

  if (error) {
    console.error('[Invoice] create_invoice RPC error:', error)
    throw new ValidationError('Failed to create invoice')
  }

  if (!data) {
    throw new ValidationError('Failed to create invoice')
  }

  return data
}

export async function updateInvoice(
  id: string,
  input: {
    invoice_number?: string
    issue_date?: string
    due_date?: string
    notes?: string
    terms?: string
    tax_rate?: number
    discount_amount?: number
    line_items?: InvoiceLineItemInput[]
  }
): Promise<InvoiceWithDetails> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('update_invoice', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
    p_invoice_number: input.invoice_number || null,
    p_issue_date: input.issue_date || null,
    p_due_date: input.due_date || null,
    p_notes: input.notes || null,
    p_terms: input.terms || null,
    p_tax_rate: input.tax_rate ?? null,
    p_discount_amount: input.discount_amount ?? null,
    p_line_items: input.line_items || null,
  }) as { data: InvoiceWithDetails | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    if (error.message?.includes('VALIDATION')) {
      throw new ValidationError(error.message.replace('VALIDATION: ', ''))
    }
    console.error('[Invoice] update_invoice RPC error:', error)
    throw new ValidationError('Failed to update invoice')
  }

  if (!data) {
    throw new ValidationError('Failed to update invoice')
  }

  return data
}

export async function deleteInvoice(id: string): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('delete_invoice', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
  }) as { error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    if (error.message?.includes('VALIDATION')) {
      throw new ValidationError(error.message.replace('VALIDATION: ', ''))
    }
    console.error('[Invoice] delete_invoice RPC error:', error)
    throw new ValidationError('Failed to delete invoice')
  }
}

interface InvoiceEmailData {
  invoice: {
    id: string
    invoice_number: string
    total: number
    currency: string
    issue_date: string
    due_date: string
    status: string
    public_token: string
  }
  client: {
    name: string
    email: string | null
  }
  user: {
    full_name: string | null
    company_name: string | null
    email: string
  }
}

export async function sendInvoice(id: string): Promise<Invoice> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Get invoice data for email in a single call
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: emailData, error: fetchError } = await (supabase.rpc as any)('get_invoice_for_email', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
  }) as { data: InvoiceEmailData | null; error: { message: string } | null }

  if (fetchError) {
    if (fetchError.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    console.error('[Invoice] get_invoice_for_email RPC error:', fetchError)
    throw new ValidationError('Failed to fetch invoice')
  }

  if (!emailData) {
    throw new NotFoundError('Invoice')
  }

  if (!emailData.client.email) {
    throw new ValidationError('Client does not have an email address')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invoiceUrl = `${appUrl}/invoice/${emailData.invoice.public_token}`

  // Format dates and amount
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const fromName = emailData.user.company_name || emailData.user.full_name || 'BillMint'

  // Send email using email service
  try {
    await sendInvoiceSentEmail({
      to: emailData.client.email,
      clientName: emailData.client.name,
      invoiceNumber: emailData.invoice.invoice_number,
      amount: formatAmount(emailData.invoice.total, emailData.invoice.currency),
      issueDate: formatDate(emailData.invoice.issue_date),
      dueDate: formatDate(emailData.invoice.due_date),
      invoiceUrl,
      fromName,
    })
  } catch (emailError) {
    console.error('Failed to send invoice email:', emailError)
    throw new ValidationError('Failed to send invoice email')
  }

  // Update invoice status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedInvoice, error } = await (supabase.rpc as any)('update_invoice_status', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
    p_action: 'send',
  }) as { data: Invoice | null; error: Error | null }

  if (error || !updatedInvoice) {
    console.error('[Invoice] update_invoice_status RPC error:', error)
    throw new ValidationError('Failed to update invoice status')
  }

  return updatedInvoice
}

export async function sendReminder(id: string): Promise<Invoice> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Get invoice data for email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: emailData, error: fetchError } = await (supabase.rpc as any)('get_invoice_for_email', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
  }) as { data: InvoiceEmailData | null; error: { message: string } | null }

  if (fetchError) {
    if (fetchError.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    console.error('[Invoice] get_invoice_for_email RPC error:', fetchError)
    throw new ValidationError('Failed to fetch invoice')
  }

  if (!emailData) {
    throw new NotFoundError('Invoice')
  }

  if (!['sent', 'overdue'].includes(emailData.invoice.status)) {
    throw new ValidationError('Can only send reminders for sent or overdue invoices')
  }

  if (!emailData.client.email) {
    throw new ValidationError('Client does not have an email address')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invoiceUrl = `${appUrl}/invoice/${emailData.invoice.public_token}`

  // Calculate status text and days
  const dueDate = new Date(emailData.invoice.due_date)
  const today = new Date()
  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  const isOverdue = emailData.invoice.status === 'overdue'
  const statusText = isOverdue
    ? `${Math.abs(diffDays)} days overdue`
    : diffDays === 0
      ? 'due today'
      : diffDays === 1
        ? 'due tomorrow'
        : `due in ${diffDays} days`
  const dueDateColor = isOverdue ? '#ef4444' : '#1e293b'

  // Format dates
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Format currency
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  const fromName = emailData.user.company_name || emailData.user.full_name || 'BillMint'

  // Send reminder using email service
  try {
    console.log('[Invoice] Sending reminder email to:', emailData.client.email)
    await sendInvoiceReminderEmail({
      to: emailData.client.email,
      clientName: emailData.client.name,
      invoiceNumber: emailData.invoice.invoice_number,
      amount: formatAmount(emailData.invoice.total, emailData.invoice.currency),
      issueDate: formatDate(emailData.invoice.issue_date),
      dueDate: formatDate(emailData.invoice.due_date),
      dueDateColor,
      statusText,
      invoiceUrl,
      fromName,
    })
    console.log('[Invoice] Reminder email sent')
  } catch (emailError) {
    console.error('Failed to send reminder email:', emailError)
    throw new ValidationError('Failed to send reminder email')
  }

  // Update reminder_sent_at
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: updatedInvoice, error } = await (supabase.rpc as any)('update_invoice_status', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
    p_action: 'reminder',
  }) as { data: Invoice | null; error: Error | null }

  if (error || !updatedInvoice) {
    console.error('[Invoice] update_invoice_status RPC error:', error)
    throw new ValidationError('Failed to update invoice')
  }

  return updatedInvoice
}

export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('update_invoice_status', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
    p_action: 'paid',
  }) as { data: Invoice | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    if (error.message?.includes('VALIDATION')) {
      throw new ValidationError(error.message.replace('VALIDATION: ', ''))
    }
    console.error('[Invoice] update_invoice_status RPC error:', error)
    throw new ValidationError('Failed to mark invoice as paid')
  }

  if (!data) {
    throw new ValidationError('Failed to mark invoice as paid')
  }

  return data
}

export async function voidInvoice(id: string): Promise<Invoice> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('update_invoice_status', {
    p_user_id: currentUser.id,
    p_invoice_id: id,
    p_action: 'void',
  }) as { data: Invoice | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    if (error.message?.includes('VALIDATION')) {
      throw new ValidationError(error.message.replace('VALIDATION: ', ''))
    }
    console.error('[Invoice] update_invoice_status RPC error:', error)
    throw new ValidationError('Failed to void invoice')
  }

  if (!data) {
    throw new ValidationError('Failed to void invoice')
  }

  return data
}

export async function getPublicInvoice(token: string): Promise<PublicInvoiceResponse> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_public_invoice', {
    p_token: token,
  }) as { data: PublicInvoiceResponse | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('Invoice')
    }
    console.error('[Invoice] get_public_invoice RPC error:', error)
    throw new ValidationError('Failed to fetch invoice')
  }

  if (!data) {
    throw new NotFoundError('Invoice')
  }

  return data
}

export async function getInvoicePdfData(id: string): Promise<InvoicePdfData> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Get invoice with details
  const invoice = await getInvoiceById(id)

  // Get user settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('date_format, default_currency')
    .eq('user_id', currentUser.id)
    .single()

  return {
    invoice,
    user: {
      full_name: currentUser.full_name,
      company_name: currentUser.company_name,
      email: currentUser.email,
    },
    settings: settings || { date_format: 'MMM d, yyyy', default_currency: 'USD' },
  }
}

export async function getPublicInvoicePdfData(token: string): Promise<InvoicePdfData> {
  const publicData = await getPublicInvoice(token)

  return {
    invoice: publicData.invoice,
    user: publicData.user,
    settings: { date_format: 'MMM d, yyyy', default_currency: publicData.invoice.currency },
  }
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
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_invoice_stats', {
    p_user_id: currentUser.id,
  }) as { data: InvoiceStats | null; error: { message: string } | null }

  if (error) {
    throw new ValidationError('Failed to fetch invoice stats')
  }

  return data || {
    outstanding: { amounts: [], count: 0 },
    overdue: { amounts: [], count: 0 },
    paid_this_year: { amounts: [], count: 0 },
  }
}

export async function duplicateInvoice(id: string): Promise<InvoiceWithDetails> {
  const currentUser = await requireAuth()

  // Get the original invoice with details
  const original = await getInvoiceById(id)

  // Create a new invoice with the same data but as draft
  const newInvoice = await createInvoice({
    client_id: original.client_id,
    due_date: original.due_date,
    notes: original.notes || undefined,
    terms: original.terms || undefined,
    tax_rate: original.tax_rate || undefined,
    discount_amount: original.discount_amount || undefined,
    line_items: original.line_items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      time_entry_ids: [], // Don't link to same time entries
    })),
  })

  return newInvoice
}
