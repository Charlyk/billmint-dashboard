import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import {
  getStartOfDay,
  getEndOfDay,
  getCurrentWeekRange,
  getCurrentMonthRange,
} from '@/lib/utils/date'
import type { DashboardStats, RecentActivity, TimeEntryWithDetails, AmountByCurrency } from '@/types/api'

type EntryWithCurrency = {
  duration_seconds: number
  hourly_rate: number | null
  is_billable: boolean
  project_id: string | null
}

type ProjectInfo = {
  id: string
  hourly_rate: number | null
  currency: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const today = new Date()
  const startOfToday = getStartOfDay(today).toISOString()
  const endOfToday = getEndOfDay(today).toISOString()

  const { start: weekStart, end: weekEnd } = getCurrentWeekRange()
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange()

  type InvoiceStats = { total: number; status: string; currency: string }

  // Get all projects with currency info
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, hourly_rate, currency')
    .eq('user_id', currentUser.id) as { data: ProjectInfo[] | null }

  const projectMap = new Map((allProjects || []).map(p => [p.id, p]))

  // Get today's entries
  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable, project_id')
    .eq('user_id', currentUser.id)
    .gte('start_time', startOfToday)
    .lte('start_time', endOfToday) as { data: EntryWithCurrency[] | null }

  // Get this week's entries
  const { data: weekEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable, project_id')
    .eq('user_id', currentUser.id)
    .gte('start_time', weekStart.toISOString())
    .lte('start_time', weekEnd.toISOString()) as { data: EntryWithCurrency[] | null }

  // Get this month's entries
  const { data: monthEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable, project_id')
    .eq('user_id', currentUser.id)
    .gte('start_time', monthStart.toISOString())
    .lte('start_time', monthEnd.toISOString()) as { data: EntryWithCurrency[] | null }

  // Get all unbilled entries
  const { data: unbilledEntries } = await supabase
    .from('time_entries')
    .select('duration_seconds, hourly_rate, is_billable, project_id')
    .eq('user_id', currentUser.id)
    .eq('is_billable', true)
    .is('invoice_id', null) as { data: EntryWithCurrency[] | null }

  // Get this month's invoices
  const { data: monthInvoices } = await supabase
    .from('invoices')
    .select('total, status, currency')
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

  // Calculate stats with currency grouping
  const todayStats = calculateEntryStatsWithCurrency(todayEntries || [], projectMap)
  const weekStats = calculateEntryStatsWithCurrency(weekEntries || [], projectMap)
  const monthStats = calculateEntryStatsWithCurrency(monthEntries || [], projectMap)
  const unbilledStats = calculateEntryStatsWithCurrency(unbilledEntries || [], projectMap)

  // Calculate invoice totals by currency
  const invoicedByCurrency = new Map<string, number>()
  const outstandingByCurrency = new Map<string, number>()

  for (const inv of monthInvoices || []) {
    const currency = inv.currency || 'USD'
    if (inv.status === 'paid') {
      invoicedByCurrency.set(currency, (invoicedByCurrency.get(currency) || 0) + (inv.total || 0))
    }
    if (['sent', 'overdue'].includes(inv.status)) {
      outstandingByCurrency.set(currency, (outstandingByCurrency.get(currency) || 0) + (inv.total || 0))
    }
  }

  return {
    today: {
      hours: todayStats.hours,
      amounts: todayStats.amounts,
      entries_count: todayEntries?.length || 0,
    },
    this_week: {
      hours: weekStats.hours,
      amounts: weekStats.amounts,
      entries_count: weekEntries?.length || 0,
    },
    this_month: {
      hours: monthStats.hours,
      amounts: monthStats.amounts,
      invoiced: mapToAmountArray(invoicedByCurrency),
      outstanding: mapToAmountArray(outstandingByCurrency),
    },
    unbilled: {
      hours: unbilledStats.hours,
      amounts: unbilledStats.amounts,
    },
    active_projects: activeProjects || 0,
    active_clients: activeClients || 0,
  }
}

function mapToAmountArray(map: Map<string, number>): AmountByCurrency[] {
  return Array.from(map.entries())
    .map(([currency, amount]) => ({ currency, amount: Math.round(amount * 100) / 100 }))
    .filter(item => item.amount > 0)
    .sort((a, b) => a.currency.localeCompare(b.currency))
}

function calculateEntryStatsWithCurrency(
  entries: EntryWithCurrency[],
  projectMap: Map<string, ProjectInfo>
): { hours: number; amounts: AmountByCurrency[] } {
  let totalSeconds = 0
  const amountsByCurrency = new Map<string, number>()

  for (const entry of entries) {
    totalSeconds += entry.duration_seconds || 0

    if (entry.is_billable) {
      const project = entry.project_id ? projectMap.get(entry.project_id) : null
      const rate = entry.hourly_rate ?? project?.hourly_rate ?? 0
      const currency = project?.currency || 'USD'
      const amount = (entry.duration_seconds / 3600) * rate

      amountsByCurrency.set(currency, (amountsByCurrency.get(currency) || 0) + amount)
    }
  }

  return {
    hours: Math.round((totalSeconds / 3600) * 100) / 100,
    amounts: mapToAmountArray(amountsByCurrency),
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

