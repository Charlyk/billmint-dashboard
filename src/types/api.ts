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

// Client responses
export interface ClientWithStats extends Client {
  project_count: number
  total_invoiced: number
  outstanding_amount: number
}

export interface ClientListResponse extends PaginatedResponse<ClientWithStats> {}

// Project responses
export interface ProjectWithClient extends Project {
  client: Pick<Client, 'id' | 'name'> | null
}

export interface ProjectWithStats extends ProjectWithClient {
  total_hours: number
  total_amount: number
  unbilled_hours: number
  unbilled_amount: number
}

export interface ProjectListResponse extends PaginatedResponse<ProjectWithStats> {}

// Time entry responses
export interface TimeEntryWithProject extends TimeEntry {
  project: Pick<Project, 'id' | 'name' | 'color' | 'hourly_rate' | 'currency'> | null
}

export interface TimeEntryWithDetails extends TimeEntryWithProject {
  client: Pick<Client, 'id' | 'name'> | null
  amount: number
}

export interface TimeEntryListResponse extends PaginatedResponse<TimeEntryWithDetails> {}

export interface UnbilledTimeEntriesResponse {
  entries: TimeEntryWithDetails[]
  total_hours: number
  total_amount: number
}

// Timer responses
export interface TimerResponse {
  timer: ActiveTimer | null
  project: Pick<Project, 'id' | 'name' | 'color'> | null
}

// Invoice responses
export interface InvoiceWithClient extends Invoice {
  client: Pick<Client, 'id' | 'name' | 'email'>
}

export interface InvoiceWithDetails extends InvoiceWithClient {
  line_items: InvoiceLineItem[]
}

export interface InvoiceListResponse extends PaginatedResponse<InvoiceWithClient> {}

export interface InvoicesQuery {
  page?: number
  limit?: number
  client_id?: string
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
export interface DashboardStats {
  today: {
    hours: number
    amount: number
    entries_count: number
  }
  this_week: {
    hours: number
    amount: number
    entries_count: number
  }
  this_month: {
    hours: number
    amount: number
    invoiced: number
    outstanding: number
  }
  active_projects: number
  active_clients: number
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
