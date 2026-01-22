import { createClient } from '@/lib/supabase/server'
import { requireAuth, requirePaidUser } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import { markEntriesAsInvoiced, unmarkEntriesFromInvoice } from './time-entry.service'
import { calculateSubtotal, calculateTax, calculateTotal } from '@/lib/utils/currency'
import type { Invoice, InvoiceLineItem } from '@/types/database'
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
  const offset = (page - 1) * limit

  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(id, name, email)
    `,
      { count: 'exact' }
    )
    .eq('user_id', currentUser.id)
    .order('issue_date', { ascending: false })

  if (options?.client_id) {
    query = query.eq('client_id', options.client_id)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.start_date) {
    query = query.gte('issue_date', options.start_date)
  }

  if (options?.end_date) {
    query = query.lte('issue_date', options.end_date)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)

  if (error) {
    throw new ValidationError('Failed to fetch invoices')
  }

  return {
    data: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

export async function getInvoiceById(id: string): Promise<InvoiceWithDetails> {
  await requirePaidUser()
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(id, name, email)
    `
    )
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: Invoice & { client: { id: string; name: string; email: string | null } | null } | null; error: Error | null }

  if (error || !invoice) {
    throw new NotFoundError('Invoice')
  }

  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order') as { data: InvoiceLineItem[] | null }

  return {
    ...invoice,
    line_items: lineItems || [],
  } as InvoiceWithDetails
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

  // Generate invoice number if not provided
  let invoiceNumber = input.invoice_number
  if (!invoiceNumber) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('invoice_prefix')
      .eq('user_id', currentUser.id)
      .single() as { data: { invoice_prefix: string } | null }

    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)

    const prefix = settings?.invoice_prefix || 'INV-'
    invoiceNumber = `${prefix}${String((count || 0) + 1).padStart(4, '0')}`
  }

  // Calculate totals
  const subtotal = calculateSubtotal(input.line_items)
  const taxRate = input.tax_rate || 0
  const taxAmount = calculateTax(subtotal, taxRate)
  const discountAmount = input.discount_amount || 0
  const total = calculateTotal(subtotal, taxRate, discountAmount)

  // Generate public token
  const publicToken = generateToken()

  // Get client currency
  const { data: clientProjects } = await supabase
    .from('projects')
    .select('currency')
    .eq('client_id', input.client_id)
    .limit(1) as { data: { currency: string }[] | null }

  const currency = clientProjects?.[0]?.currency || 'USD'

  // Create invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      user_id: currentUser.id,
      client_id: input.client_id,
      invoice_number: invoiceNumber,
      issue_date: input.issue_date || new Date().toISOString(),
      due_date: input.due_date,
      notes: input.notes,
      terms: input.terms,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      subtotal,
      total,
      currency,
      public_token: publicToken,
      status: 'draft',
    } as never)
    .select(
      `
      *,
      client:clients(id, name, email)
    `
    )
    .single() as { data: Invoice & { client: { id: string; name: string; email: string | null } } | null; error: Error | null }

  if (error || !invoice) {
    throw new ValidationError('Failed to create invoice')
  }

  // Create line items
  const lineItemsToInsert = input.line_items.map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
    time_entry_id: item.time_entry_id || null,
    sort_order: index,
  }))

  const { data: lineItems, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsToInsert as never)
    .select() as { data: InvoiceLineItem[] | null; error: Error | null }

  if (lineItemsError) {
    // Rollback invoice creation
    await supabase.from('invoices').delete().eq('id', invoice.id)
    throw new ValidationError('Failed to create invoice line items')
  }

  // Mark time entries as invoiced
  const timeEntryIds = input.line_items
    .filter((item) => item.time_entry_id)
    .map((item) => item.time_entry_id!)

  if (timeEntryIds.length > 0) {
    await markEntriesAsInvoiced(timeEntryIds, invoice.id)
  }

  return {
    ...invoice,
    line_items: lineItems || [],
  } as InvoiceWithDetails
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

  // Verify ownership and get current invoice
  const { data: existingInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: Invoice | null }

  if (!existingInvoice) {
    throw new NotFoundError('Invoice')
  }

  if (existingInvoice.status !== 'draft') {
    throw new ValidationError('Only draft invoices can be edited')
  }

  // Recalculate totals if line items are being updated
  let subtotal = existingInvoice.subtotal
  let taxAmount = existingInvoice.tax_amount
  let total = existingInvoice.total

  if (input.line_items) {
    subtotal = calculateSubtotal(input.line_items)
    const taxRate = input.tax_rate ?? existingInvoice.tax_rate
    taxAmount = calculateTax(subtotal, taxRate)
    const discountAmount = input.discount_amount ?? existingInvoice.discount_amount
    total = calculateTotal(subtotal, taxRate, discountAmount)
  } else if (input.tax_rate !== undefined || input.discount_amount !== undefined) {
    const taxRate = input.tax_rate ?? existingInvoice.tax_rate
    taxAmount = calculateTax(subtotal, taxRate)
    const discountAmount = input.discount_amount ?? existingInvoice.discount_amount
    total = calculateTotal(subtotal, taxRate, discountAmount)
  }

  // Update invoice
  const { data: invoice, error } = await supabase
    .from('invoices')
    .update({
      invoice_number: input.invoice_number,
      issue_date: input.issue_date,
      due_date: input.due_date,
      notes: input.notes,
      terms: input.terms,
      tax_rate: input.tax_rate,
      tax_amount: taxAmount,
      discount_amount: input.discount_amount,
      subtotal,
      total,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select(
      `
      *,
      client:clients(id, name, email)
    `
    )
    .single() as { data: Invoice & { client: { id: string; name: string; email: string | null } } | null; error: Error | null }

  if (error || !invoice) {
    throw new ValidationError('Failed to update invoice')
  }

  // Update line items if provided
  if (input.line_items) {
    // Unmark old time entries
    await unmarkEntriesFromInvoice(id)

    // Delete old line items
    await supabase.from('invoice_line_items').delete().eq('invoice_id', id)

    // Create new line items
    const lineItemsToInsert = input.line_items.map((item, index) => ({
      invoice_id: id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.quantity * item.unit_price,
      time_entry_id: item.time_entry_id || null,
      sort_order: index,
    }))

    await supabase.from('invoice_line_items').insert(lineItemsToInsert as never)

    // Mark new time entries as invoiced
    const timeEntryIds = input.line_items
      .filter((item) => item.time_entry_id)
      .map((item) => item.time_entry_id!)

    if (timeEntryIds.length > 0) {
      await markEntriesAsInvoiced(timeEntryIds, id)
    }
  }

  // Fetch updated line items
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order') as { data: InvoiceLineItem[] | null }

  return {
    ...invoice,
    line_items: lineItems || [],
  } as InvoiceWithDetails
}

export async function deleteInvoice(id: string): Promise<void> {
  await requirePaidUser()
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Verify ownership and status
  const { data: invoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: { status: string } | null }

  if (!invoice) {
    throw new NotFoundError('Invoice')
  }

  if (invoice.status !== 'draft') {
    throw new ValidationError('Only draft invoices can be deleted')
  }

  // Unmark time entries
  await unmarkEntriesFromInvoice(id)

  // Delete line items
  await supabase.from('invoice_line_items').delete().eq('invoice_id', id)

  // Delete invoice
  const { error } = await supabase.from('invoices').delete().eq('id', id)

  if (error) {
    throw new ValidationError('Failed to delete invoice')
  }
}

export async function sendInvoice(id: string): Promise<Invoice> {
  await requirePaidUser()
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const invoice = await getInvoiceById(id)

  if (!invoice.client.email) {
    throw new ValidationError('Client does not have an email address')
  }

  // Get user info for email
  const { data: user } = await supabase
    .from('users')
    .select('full_name, company_name, email')
    .eq('id', currentUser.id)
    .single() as { data: { full_name: string | null; company_name: string | null; email: string } | null }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invoiceUrl = `${appUrl}/invoice/${invoice.public_token}`

  // Send email
  try {
    await getResend().emails.send({
      from: 'BillMint <noreply@billmint.app>',
      to: invoice.client.email,
      subject: `Invoice ${invoice.invoice_number} from ${user?.company_name || user?.full_name || 'BillMint'}`,
      html: `
        <h1>You have a new invoice</h1>
        <p>Invoice #${invoice.invoice_number}</p>
        <p>Amount: $${invoice.total.toFixed(2)}</p>
        <p>Due date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p><a href="${invoiceUrl}">View Invoice</a></p>
      `,
    })
  } catch (emailError) {
    console.error('Failed to send invoice email:', emailError)
    throw new ValidationError('Failed to send invoice email')
  }

  // Update invoice status
  const { data: updatedInvoice, error } = await supabase
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select()
    .single() as { data: Invoice | null; error: Error | null }

  if (error || !updatedInvoice) {
    throw new ValidationError('Failed to update invoice status')
  }

  return updatedInvoice
}

export async function sendReminder(id: string): Promise<Invoice> {
  await requirePaidUser()
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const invoice = await getInvoiceById(id)

  if (!['sent', 'overdue'].includes(invoice.status)) {
    throw new ValidationError('Can only send reminders for sent or overdue invoices')
  }

  if (!invoice.client.email) {
    throw new ValidationError('Client does not have an email address')
  }

  const { data: user } = await supabase
    .from('users')
    .select('full_name, company_name')
    .eq('id', currentUser.id)
    .single() as { data: { full_name: string | null; company_name: string | null } | null }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const invoiceUrl = `${appUrl}/invoice/${invoice.public_token}`

  try {
    await getResend().emails.send({
      from: 'BillMint <noreply@billmint.app>',
      to: invoice.client.email,
      subject: `Reminder: Invoice ${invoice.invoice_number} from ${user?.company_name || user?.full_name || 'BillMint'}`,
      html: `
        <h1>Payment Reminder</h1>
        <p>This is a friendly reminder that invoice #${invoice.invoice_number} is ${invoice.status === 'overdue' ? 'overdue' : 'due soon'}.</p>
        <p>Amount: $${invoice.total.toFixed(2)}</p>
        <p>Due date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
        <p><a href="${invoiceUrl}">View Invoice</a></p>
      `,
    })
  } catch (emailError) {
    console.error('Failed to send reminder email:', emailError)
    throw new ValidationError('Failed to send reminder email')
  }

  const { data: updatedInvoice, error } = await supabase
    .from('invoices')
    .update({
      reminder_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select()
    .single() as { data: Invoice | null; error: Error | null }

  if (error || !updatedInvoice) {
    throw new ValidationError('Failed to update invoice')
  }

  return updatedInvoice
}

export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
  await requirePaidUser()
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: { status: string } | null }

  if (!invoice) {
    throw new NotFoundError('Invoice')
  }

  if (!['sent', 'overdue'].includes(invoice.status)) {
    throw new ValidationError('Can only mark sent or overdue invoices as paid')
  }

  const { data: updatedInvoice, error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select()
    .single() as { data: Invoice | null; error: Error | null }

  if (error || !updatedInvoice) {
    throw new ValidationError('Failed to mark invoice as paid')
  }

  return updatedInvoice
}

export async function voidInvoice(id: string): Promise<Invoice> {
  await requirePaidUser()
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('status')
    .eq('id', id)
    .eq('user_id', currentUser.id)
    .single() as { data: { status: string } | null }

  if (!invoice) {
    throw new NotFoundError('Invoice')
  }

  if (invoice.status === 'void') {
    throw new ValidationError('Invoice is already void')
  }

  // Unmark time entries
  await unmarkEntriesFromInvoice(id)

  const { data: updatedInvoice, error } = await supabase
    .from('invoices')
    .update({
      status: 'void',
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select()
    .single() as { data: Invoice | null; error: Error | null }

  if (error || !updatedInvoice) {
    throw new ValidationError('Failed to void invoice')
  }

  return updatedInvoice
}

export async function getPublicInvoice(token: string): Promise<PublicInvoiceResponse> {
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      client:clients(id, name, email)
    `
    )
    .eq('public_token', token)
    .single() as { data: Invoice & { client: { id: string; name: string; email: string | null } | null } | null; error: Error | null }

  if (error || !invoice) {
    throw new NotFoundError('Invoice')
  }

  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', invoice.id)
    .order('sort_order') as { data: InvoiceLineItem[] | null }

  const { data: user } = await supabase
    .from('users')
    .select('full_name, company_name, email')
    .eq('id', invoice.user_id)
    .single() as { data: { full_name: string | null; company_name: string | null; email: string } | null }

  return {
    invoice: {
      ...invoice,
      line_items: lineItems || [],
    } as InvoiceWithDetails,
    user: user || { full_name: null, company_name: null, email: '' },
  }
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
