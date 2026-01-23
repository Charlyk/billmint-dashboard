import { createClient } from '@/lib/supabase/server'
import { requireAuth, requirePaidUser } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { Invoice } from '@/types/database'
import type {
  InvoiceWithDetails,
  InvoiceListResponse,
  PublicInvoiceResponse,
  InvoicesQuery,
  InvoiceLineItemInput,
} from '@/types/api'
import { Resend } from 'resend'

// Lazy initialization of Resend to avoid build errors
let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new ValidationError('Email service is not configured')
    }
    resendInstance = new Resend(apiKey)
  }
  return resendInstance
}

export async function listInvoices(
  options?: InvoicesQuery
): Promise<InvoiceListResponse> {
  await requirePaidUser()
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const page = options?.page || 1
  const limit = options?.limit || 20

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('list_invoices', {
    p_user_id: currentUser.id,
    p_page: page,
    p_limit: limit,
    p_client_id: options?.client_id || null,
    p_status: options?.status || null,
    p_start_date: options?.start_date || null,
    p_end_date: options?.end_date || null,
  }) as { data: InvoiceListResponse | null; error: Error | null }

  if (error) {
    console.error('[Invoice] list_invoices RPC error:', error)
    throw new ValidationError('Failed to fetch invoices')
  }

  return data || {
    data: [],
    pagination: { page, limit, total: 0, totalPages: 0 },
  }
}

export async function getInvoiceById(id: string): Promise<InvoiceWithDetails> {
  await requirePaidUser()
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
  await requirePaidUser()
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
    p_line_items: JSON.stringify(input.line_items),
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
  await requirePaidUser()
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
    p_line_items: input.line_items ? JSON.stringify(input.line_items) : null,
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
  await requirePaidUser()
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
  await requirePaidUser()
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

  // Send email
  try {
    await getResend().emails.send({
      from: 'BillMint <noreply@billmint.app>',
      to: emailData.client.email,
      subject: `Invoice ${emailData.invoice.invoice_number} from ${emailData.user.company_name || emailData.user.full_name || 'BillMint'}`,
      html: `
        <h1>You have a new invoice</h1>
        <p>Invoice #${emailData.invoice.invoice_number}</p>
        <p>Amount: $${emailData.invoice.total.toFixed(2)}</p>
        <p>Due date: ${new Date(emailData.invoice.due_date).toLocaleDateString()}</p>
        <p><a href="${invoiceUrl}">View Invoice</a></p>
      `,
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
  await requirePaidUser()
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

  try {
    await getResend().emails.send({
      from: 'BillMint <noreply@billmint.app>',
      to: emailData.client.email,
      subject: `Reminder: Invoice ${emailData.invoice.invoice_number} from ${emailData.user.company_name || emailData.user.full_name || 'BillMint'}`,
      html: `
        <h1>Payment Reminder</h1>
        <p>This is a friendly reminder that invoice #${emailData.invoice.invoice_number} is ${emailData.invoice.status === 'overdue' ? 'overdue' : 'due soon'}.</p>
        <p>Amount: $${emailData.invoice.total.toFixed(2)}</p>
        <p>Due date: ${new Date(emailData.invoice.due_date).toLocaleDateString()}</p>
        <p><a href="${invoiceUrl}">View Invoice</a></p>
      `,
    })
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
  await requirePaidUser()
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
  await requirePaidUser()
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
