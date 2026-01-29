import type {
  User,
  UserSettings,
  Client,
  Project,
  TimeEntry,
  ActiveTimer,
  Invoice,
  InvoiceLineItem,
} from './database'

// API Response wrapper
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

export interface ApiError {
  message: string
  code: string
  statusCode: number
  errors?: Record<string, string[]>
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Auth responses
export interface AuthResponse {
  user: User
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export interface SessionResponse {
  user: User | null
  session: {
    access_token: string
    expires_at: number
  } | null
}

// User responses
export interface UserWithSettings extends User {
  settings: UserSettings
}

// Amount by currency
export interface AmountByCurrency {
  currency: string
  amount: number
}

// Client responses
export interface ClientWithStats extends Client {
  project_count: number
  total_invoiced: AmountByCurrency[]
  outstanding_amount: AmountByCurrency[]
  unbilled_amount: AmountByCurrency[]
  // currency is inherited from Client type
}

export type ClientListResponse = PaginatedResponse<ClientWithStats>

// Project responses
export interface ProjectWithClient extends Project {
  client: Pick<Client, 'id' | 'name' | 'currency'> | null
}

export interface ProjectWithStats extends ProjectWithClient {
  total_hours: number
  total_amount: number
  unbilled_hours: number
  unbilled_amount: number
}

export type ProjectListResponse = PaginatedResponse<ProjectWithStats>

// Time entry responses
export interface TimeEntryWithProject extends TimeEntry {
  project: Pick<Project, 'id' | 'name' | 'color' | 'hourly_rate'> | null
}

export interface TimeEntryWithDetails extends TimeEntryWithProject {
  client: Pick<Client, 'id' | 'name' | 'currency'> | null
  amount: number
}

export type TimeEntryListResponse = PaginatedResponse<TimeEntryWithDetails>

export interface UnbilledTimeEntriesResponse {
  entries: TimeEntryWithDetails[]
  total_hours: number
  total_amount: number
}

// Timer responses
export interface TimerResponse {
  timer: ActiveTimer | null
  project: Pick<Project, 'id' | 'name' | 'color'> | null
  autoPaused?: boolean // True if timer was automatically paused due to max_timer_hours setting
}

// Invoice responses
export interface InvoiceWithClient extends Invoice {
  client: Pick<Client, 'id' | 'name' | 'email'>
}

export interface InvoiceWithDetails extends InvoiceWithClient {
  line_items: InvoiceLineItem[]
}

export type InvoiceListResponse = PaginatedResponse<InvoiceWithClient>

export interface InvoicesQuery {
  page?: number
  limit?: number
  client_id?: string
  project_id?: string
  status?: string
  start_date?: string
  end_date?: string
}

export interface TimeEntriesQuery {
  page?: number
  limit?: number
  project_id?: string
  client_id?: string
  start_date?: string
  end_date?: string
  is_billable?: boolean
  is_invoiced?: boolean
  search?: string
}

export interface InvoiceLineItemInput {
  description: string
  quantity: number
  unit_price: number
  amount?: number
  time_entry_id?: string | null
}

export interface PublicInvoiceResponse {
  invoice: InvoiceWithDetails
  user: Pick<User, 'full_name' | 'company_name' | 'email'>
}

// Dashboard responses
export interface OverdueInvoiceSummary {
  id: string
  invoice_number: string
  client_name: string
  total: number
  currency: string
  due_date: string
  days_overdue: number
}

export interface OverdueInvoicesInfo {
  count: number
  amounts: AmountByCurrency[]
  invoices: OverdueInvoiceSummary[]
}

export interface DashboardStats {
  today: {
    hours: number
    amounts: AmountByCurrency[]
    entries_count: number
  }
  this_week: {
    hours: number
    amounts: AmountByCurrency[]
    entries_count: number
  }
  this_month: {
    hours: number
    amounts: AmountByCurrency[]
    invoiced: AmountByCurrency[]
    outstanding: AmountByCurrency[]
  }
  unbilled: {
    hours: number
    amounts: AmountByCurrency[]
  }
  active_projects: number
  active_clients: number
  overdue_invoices: OverdueInvoicesInfo
}

export interface RecentActivity {
  entries: TimeEntryWithDetails[]
  grouped_by_date: {
    date: string
    entries: TimeEntryWithDetails[]
    total_hours: number
    total_amount: number
  }[]
}

// Billing responses
export interface SubscriptionResponse {
  tier: User['tier']
  subscription: {
    id: string
    status: string
    current_period_end: string
    cancel_at_period_end: boolean
  } | null
}

export interface CheckoutSessionResponse {
  url: string
}

export interface PortalSessionResponse {
  url: string
}

// PDF generation types
export interface InvoicePdfData {
  invoice: InvoiceWithDetails
  user: Pick<User, 'full_name' | 'company_name' | 'email'>
  settings: { date_format: string; default_currency: string }
}

// Report types
export interface TimeReport {
  period: {
    start: string
    end: string
  }
  summary: {
    total_hours: number
    total_amount: number
    billable_hours: number
    billable_amount: number
    non_billable_hours: number
  }
  by_project: {
    project: Pick<Project, 'id' | 'name' | 'color'>
    hours: number
    amount: number
  }[]
  by_client: {
    client: Pick<Client, 'id' | 'name'> | null
    hours: number
    amount: number
  }[]
  by_day: {
    date: string
    hours: number
    amount: number
  }[]
}
