import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import type { DashboardStats, RecentActivity, TimeEntryWithDetails, AmountByCurrency, OverdueInvoiceSummary } from '@/types/api'

// Type for the Supabase function response
interface DashboardDataResponse {
  stats: {
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
    total_invoices: number
    total_time_entries: number
    overdue_invoices: {
      count: number
      amounts: AmountByCurrency[]
      invoices: OverdueInvoiceSummary[]
    }
  }
  recent_entries: TimeEntryWithDetails[]
}

export interface DashboardData {
  stats: DashboardStats
  recentActivity: RecentActivity
}

/**
 * Gets all dashboard data in a single database call.
 * Uses a Supabase function for optimal performance.
 */
export async function getDashboardData(recentEntriesLimit: number = 10): Promise<DashboardData> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_dashboard_data', {
    p_user_id: currentUser.id,
    p_recent_entries_limit: recentEntriesLimit,
  }) as { data: DashboardDataResponse | null; error: Error | null }

  if (error) {
    console.error('[Dashboard] RPC error:', error)
    throw new Error(`Failed to fetch dashboard data: ${error.message}`)
  }

  if (!data) {
    throw new Error('No data returned from dashboard function')
  }

  // Transform the response to match the expected types
  const stats: DashboardStats = {
    today: {
      hours: data.stats.today.hours || 0,
      amounts: data.stats.today.amounts || [],
      entries_count: data.stats.today.entries_count || 0,
    },
    this_week: {
      hours: data.stats.this_week.hours || 0,
      amounts: data.stats.this_week.amounts || [],
      entries_count: data.stats.this_week.entries_count || 0,
    },
    this_month: {
      hours: data.stats.this_month.hours || 0,
      amounts: data.stats.this_month.amounts || [],
      invoiced: data.stats.this_month.invoiced || [],
      outstanding: data.stats.this_month.outstanding || [],
    },
    unbilled: {
      hours: data.stats.unbilled.hours || 0,
      amounts: data.stats.unbilled.amounts || [],
    },
    active_projects: data.stats.active_projects || 0,
    active_clients: data.stats.active_clients || 0,
    total_invoices: data.stats.total_invoices || 0,
    total_time_entries: data.stats.total_time_entries || 0,
    overdue_invoices: {
      count: data.stats.overdue_invoices?.count || 0,
      amounts: data.stats.overdue_invoices?.amounts || [],
      invoices: data.stats.overdue_invoices?.invoices || [],
    },
  }

  // Group entries by date for the recent activity
  const entries = data.recent_entries || []
  const grouped = new Map<
    string,
    { entries: TimeEntryWithDetails[]; total_hours: number; total_amount: number }
  >()

  for (const entry of entries) {
    const date = new Date(entry.start_time).toISOString().split('T')[0]

    if (!grouped.has(date)) {
      grouped.set(date, { entries: [], total_hours: 0, total_amount: 0 })
    }

    const group = grouped.get(date)!
    group.entries.push(entry)
    group.total_hours += entry.duration_seconds / 3600
    group.total_amount += entry.amount || 0
  }

  const groupedByDate = Array.from(grouped.entries()).map(([date, dateData]) => ({
    date,
    entries: dateData.entries,
    total_hours: Math.round(dateData.total_hours * 100) / 100,
    total_amount: Math.round(dateData.total_amount * 100) / 100,
  }))

  const recentActivity: RecentActivity = {
    entries,
    grouped_by_date: groupedByDate,
  }

  return { stats, recentActivity }
}
