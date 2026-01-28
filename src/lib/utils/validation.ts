import { z } from 'zod'

// Client schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  contact_name: z.string().max(100).optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})

export const updateClientSchema = createClientSchema.extend({
  is_archived: z.boolean().optional(),
}).partial()

// Project schemas
export const projectColorSchema = z.enum([
  'emerald',
  'blue',
  'purple',
  'pink',
  'orange',
  'yellow',
  'slate',
  'red',
])

export const currencySchema = z.enum([
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'INR', 'BRL', 'MXN',
  'PLN', 'RON', 'SEK', 'NOK', 'DKK', 'NZD', 'SGD', 'HKD', 'ZAR', 'AED'
])

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  client_id: z.string().uuid().optional().nullable(),
  color: projectColorSchema.default('blue'),
  hourly_rate: z.number().min(0).optional().nullable(),
  currency: currencySchema.default('USD'),
  is_billable: z.boolean().default(true),
  is_default: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
})

// Update schema without defaults to avoid overwriting existing values
export const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  client_id: z.string().uuid().nullable().optional(),
  color: projectColorSchema.optional(),
  hourly_rate: z.number().min(0).nullable().optional(),
  currency: currencySchema.optional(),
  is_billable: z.boolean().optional(),
  is_default: z.boolean().optional(),
  is_archived: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
})

// Time entry schemas
export const createTimeEntrySchema = z.object({
  description: z.string().max(500).optional(),
  project_id: z.string().uuid().optional().nullable(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional().nullable(),
  duration_seconds: z.number().int().min(0).optional(),
  is_billable: z.boolean().default(true),
  hourly_rate: z.number().min(0).optional().nullable(),
  notes: z.string().max(1000).optional(),
})

export const updateTimeEntrySchema = createTimeEntrySchema.partial()

// Timer schemas
export const startTimerSchema = z.object({
  description: z.string().max(500).optional(),
  project_id: z.string().uuid().optional().nullable(),
  is_billable: z.boolean().default(true),
})

export const syncTimerSchema = z.object({
  description: z.string().max(500).optional(),
  project_id: z.string().uuid().optional().nullable(),
  is_billable: z.boolean().default(true),
  start_time: z.string().datetime(),
  elapsed_seconds: z.number().int().min(0),
})

// Invoice schemas
export const invoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'paid',
  'overdue',
  'void',
])

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  quantity: z.number().min(0),
  unit_price: z.number().min(0),
  time_entry_id: z.string().uuid().optional().nullable(),
})

export const createInvoiceSchema = z.object({
  client_id: z.string().uuid('Client is required'),
  invoice_number: z.string().max(50).optional(),
  issue_date: z.string().datetime().optional(),
  due_date: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  line_items: z.array(invoiceLineItemSchema).min(1, 'At least one line item is required'),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

// User settings schemas
export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  company_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
})

export const updateSettingsSchema = z.object({
  default_currency: currencySchema.optional(),
  default_hourly_rate: z.number().min(0).optional(),
  week_starts_on: z.number().int().min(0).max(6).optional(),
  time_format: z.enum(['12h', '24h']).optional(),
  date_format: z.string().max(20).optional(),
  invoice_prefix: z.string().max(10).optional(),
  invoice_notes: z.string().max(2000).optional(),
  invoice_terms: z.string().max(2000).optional(),
  max_timer_hours: z.number().min(1).max(24).nullable().optional(),
})

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Name is required').max(100),
  timezone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
})

export const updatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const dateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

// Helper to properly parse boolean strings from URL query params
const booleanStringSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null) return undefined
    if (typeof val === 'boolean') return val
    if (val === 'true' || val === '1') return true
    if (val === 'false' || val === '0') return false
    return undefined
  })

export const timeEntriesQuerySchema = paginationSchema.extend({
  project_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  is_billable: booleanStringSchema,
  is_invoiced: booleanStringSchema,
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  search: z.string().optional(),
})

export const invoicesQuerySchema = paginationSchema.extend({
  client_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  status: invoiceStatusSchema.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

// Bulk time entry action schema
export const bulkTimeEntryActionSchema = z.object({
  action: z.enum(['delete', 'mark-billable', 'mark-non-billable']),
  entry_ids: z.array(z.string().uuid()).min(1).max(100),
})

// Type exports
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>
export type StartTimerInput = z.infer<typeof startTimerSchema>
export type SyncTimerInput = z.infer<typeof syncTimerSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
export type InvoiceLineItemInput = z.infer<typeof invoiceLineItemSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type TimeEntriesQuery = z.infer<typeof timeEntriesQuerySchema>
export type InvoicesQuery = z.infer<typeof invoicesQuerySchema>
export type BulkTimeEntryAction = z.infer<typeof bulkTimeEntryActionSchema>
