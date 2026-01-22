import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import {
  getStartOfDay,
  getEndOfDay,
  getCurrentWeekRange,
  getCurrentMonthRange,
} from '@/lib/utils/date'
import type { DashboardStats, RecentActivity, TimeEntryWithDetails } from '@/types/api'

export async function getDashboardStats(): Promise<DashboardStats> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const today = new Date()
  const startOfToday = getStartOfDay(today).toISOString()
  const endOfToday = getEndOfDay(today).toISOString()

  const { start: weekStart, end: weekEnd } = getCurrentWeekRange()
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange()

  type EntryStats = { duration_seconds: number; hourly_rate: number | null; is_billable: boolean }
  type InvoiceStats = { total: number; status: string }

  // Get today's entries
  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable')
    .eq('user_id', currentUser.id)
    .gte('start_time', startOfToday)
    .lte('start_time', endOfToday) as { data: EntryStats[] | null }

  // Get this week's entries
  const { data: weekEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable')
    .eq('user_id', currentUser.id)
    .gte('start_time', weekStart.toISOString())
    .lte('start_time', weekEnd.toISOString()) as { data: EntryStats[] | null }

  // Get this month's entries
  const { data: monthEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable')
    .eq('user_id', currentUser.id)
    .gte('start_time', monthStart.toISOString())
    .lte('start_time', monthEnd.toISOString()) as { data: EntryStats[] | null }

  // Get this month's invoices
  const { data: monthInvoices } = await supabase
    .from('invoices')
    .select('total, status')
    .eq('user_id', currentUser.id)
    .gte('issue_date', monthStart.toISOString())
    .lte('issue_date', monthEnd.toISOString()) as { data: InvoiceStats[] | null }

  // Get active projects count
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('is_archived', false)

  // Get active clients count
  const { count: activeClients } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', currentUser.id)
    .eq('is_archived', false)

  // Calculate today's stats
  const todayStats = calculateEntryStats(todayEntries || [])

  // Calculate this week's stats
  const weekStats = calculateEntryStats(weekEntries || [])

  // Calculate this month's stats
  const monthStats = calculateEntryStats(monthEntries || [])

  // Calculate invoice totals
  const invoiced = (monthInvoices || [])
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  const outstanding = (monthInvoices || [])
    .filter((inv) => ['sent', 'overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.total || 0), 0)

  return {
    today: {
      hours: todayStats.hours,
      amount: todayStats.amount,
      entries_count: todayEntries?.length || 0,
    },
    this_week: {
      hours: weekStats.hours,
      amount: weekStats.amount,
      entries_count: weekEntries?.length || 0,
    },
    this_month: {
      hours: monthStats.hours,
      amount: monthStats.amount,
      invoiced,
      outstanding,
    },
    active_projects: activeProjects || 0,
    active_clients: activeClients || 0,
  }
}

export async function getRecentActivity(limit: number = 10): Promise<RecentActivity> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  interface EntryWithProject {
    id: string
    user_id: string
    project_id: string | null
    description: string | null
    start_time: string
    end_time: string | null
    duration_seconds: number
    hourly_rate: number | null
    is_billable: boolean
    is_invoiced: boolean
    invoice_id: string | null
    created_at: string
    updated_at: string
    project: {
      id: string
      name: string
      color: string | null
      hourly_rate: number | null
      currency: string
      client: { id: string; name: string } | null
    } | null
  }

  const { data: entries } = await supabase
    .from('time_entries')
    .select(
      `
      *,
      project:projects(id, name, color, hourly_rate, currency, client:clients(id, name))
    `
    )
    .eq('user_id', currentUser.id)
    .order('start_time', { ascending: false })
    .limit(limit) as { data: EntryWithProject[] | null }

  const entriesWithDetails = (entries || []).map((entry) => {
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    const amount = entry.is_billable
      ? Math.round((entry.duration_seconds / 3600) * rate * 100) / 100
      : 0

    return {
      ...entry,
      client: entry.project?.client || null,
      amount,
    }
  }) as unknown as TimeEntryWithDetails[]

  // Group by date
  const grouped = new Map<
    string,
    { entries: TimeEntryWithDetails[]; total_hours: number; total_amount: number }
  >()

  for (const entry of entriesWithDetails) {
    const date = new Date(entry.start_time).toISOString().split('T')[0]

    if (!grouped.has(date)) {
      grouped.set(date, { entries: [], total_hours: 0, total_amount: 0 })
    }

    const group = grouped.get(date)!
    group.entries.push(entry)
    group.total_hours += entry.duration_seconds / 3600
    group.total_amount += entry.amount
  }

  const groupedByDate = Array.from(grouped.entries()).map(([date, data]) => ({
    date,
    entries: data.entries,
    total_hours: Math.round(data.total_hours * 100) / 100,
    total_amount: Math.round(data.total_amount * 100) / 100,
  }))

  return {
    entries: entriesWithDetails,
    grouped_by_date: groupedByDate,
  }
}

function calculateEntryStats(
  entries: Array<{
    duration_seconds: number
    hourly_rate: number | null
    is_billable: boolean
  }>
): { hours: number; amount: number } {
  let totalSeconds = 0
  let totalAmount = 0

  for (const entry of entries) {
    totalSeconds += entry.duration_seconds || 0
    if (entry.is_billable) {
      const rate = entry.hourly_rate || 0
      totalAmount += (entry.duration_seconds / 3600) * rate
    }
  }

  return {
    hours: Math.round((totalSeconds / 3600) * 100) / 100,
    amount: Math.round(totalAmount * 100) / 100,
  }
}
