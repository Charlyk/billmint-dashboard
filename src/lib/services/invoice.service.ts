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
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const page = options?.page || 1
  const limit = options?.limit || 20

  const params = {
    p_user_id: currentUser.id,
    p_page: page,
    p_limit: limit,
    p_client_id: options?.client_id || null,
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

  // Send email
  try {
    await getResend().emails.send({
      from: 'BillMint <noreply@billmint.io>',
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

  try {
    console.log('[Invoice] Sending reminder email to:', emailData.client.email)
    const result = await getResend().emails.send({
      from: 'BillMint <noreply@billmint.io>',
      to: emailData.client.email,
      subject: `Reminder: Invoice ${emailData.invoice.invoice_number} from ${fromName}`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">

      <a href="https://billmint.io" style="text-decoration: none; margin-bottom: 24px; display: block;">
        <img src="https://billmint.io/billmint_logo_wbg.webp" alt="BillMint" width="32" style="height: auto; display: block;">
      </a>

      <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 16px 0; color: #1e293b;">Payment Reminder</h1>

      <p style="margin: 0 0 16px 0; color: #475569;">Hi ${emailData.client.name},</p>

      <p style="margin: 0 0 16px 0; color: #475569;">This is a friendly reminder that invoice <strong>${emailData.invoice.invoice_number}</strong> is ${statusText}.</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Invoice</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${emailData.invoice.invoice_number}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Amount Due</td>
            <td style="font-weight: 600; color: #14b8a6; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${formatAmount(emailData.invoice.total, emailData.invoice.currency)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">Issue Date</td>
            <td style="font-weight: 600; color: #1e293b; text-align: right; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${formatDate(emailData.invoice.issue_date)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-size: 14px; padding: 8px 0;">Due Date</td>
            <td style="font-weight: 600; color: ${dueDateColor}; text-align: right; padding: 8px 0;">${formatDate(emailData.invoice.due_date)}</td>
          </tr>
        </table>
      </div>

      <a href="${invoiceUrl}" style="display: inline-block; background: #14b8a6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Invoice</a>

      <p style="margin: 24px 0 0 0; color: #475569;">If you've already sent payment, please disregard this reminder.</p>

      <p style="margin: 16px 0 0 0; color: #475569;">Thanks,<br>${fromName}</p>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8;">
        <p style="margin: 0;">Sent via <a href="https://billmint.io" style="color: #64748b; text-decoration: none;">BillMint</a></p>
      </div>
    </div>
  </div>
</body>
</html>`,
    })
    console.log('[Invoice] Reminder email sent, result:', result)
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
