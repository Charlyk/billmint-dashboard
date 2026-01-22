import { createClient } from '@/lib/supabase/server'
import { requirePaidUser } from './auth.service'
import { ValidationError } from '@/lib/utils/errors'
import type { TimeReport } from '@/types/api'

export async function generateTimeReport(options: {
  start_date: string
  end_date: string
  project_id?: string
  client_id?: string
}): Promise<TimeReport> {
  const currentUser = await requirePaidUser()
  const supabase = await createClient()

  let query = supabase
    .from('time_entries')
    .select(
      `
      *,
      project:projects(id, name, color, client_id, client:clients(id, name))
    `
    )
    .eq('user_id', currentUser.id)
    .gte('start_time', options.start_date)
    .lte('start_time', options.end_date)
    .order('start_time', { ascending: true })

  if (options.project_id) {
    query = query.eq('project_id', options.project_id)
  }

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
    project: {
      id: string
      name: string
      color: string
      client_id: string | null
      hourly_rate: number | null
      client: { id: string; name: string } | null
    } | null
  }

  const { data: entries, error } = await query as { data: EntryWithProject[] | null; error: Error | null }

  if (error) {
    throw new ValidationError('Failed to generate report')
  }

  // Filter by client if specified
  let filteredEntries = entries || []
  if (options.client_id) {
    filteredEntries = filteredEntries.filter(
      (e) => e.project?.client_id === options.client_id
    )
  }

  // Calculate summary
  let totalSeconds = 0
  let billableSeconds = 0
  let totalAmount = 0
  let billableAmount = 0

  for (const entry of filteredEntries) {
    const duration = entry.duration_seconds || 0
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    const amount = (duration / 3600) * rate

    totalSeconds += duration

    if (entry.is_billable) {
      billableSeconds += duration
      billableAmount += amount
    }

    totalAmount += amount
  }

  // Group by project
  const projectMap = new Map<
    string,
    { project: { id: string; name: string; color: string }; hours: number; amount: number }
  >()

  for (const entry of filteredEntries) {
    if (!entry.project) continue

    const key = entry.project.id
    if (!projectMap.has(key)) {
      projectMap.set(key, {
        project: {
          id: entry.project.id,
          name: entry.project.name,
          color: entry.project.color,
        },
        hours: 0,
        amount: 0,
      })
    }

    const group = projectMap.get(key)!
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    group.hours += entry.duration_seconds / 3600
    if (entry.is_billable) {
      group.amount += (entry.duration_seconds / 3600) * rate
    }
  }

  // Group by client
  const clientMap = new Map<
    string | null,
    { client: { id: string; name: string } | null; hours: number; amount: number }
  >()

  for (const entry of filteredEntries) {
    const client = entry.project?.client || null
    const key = client?.id || null

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        client: client ? { id: client.id, name: client.name } : null,
        hours: 0,
        amount: 0,
      })
    }

    const group = clientMap.get(key)!
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    group.hours += entry.duration_seconds / 3600
    if (entry.is_billable) {
      group.amount += (entry.duration_seconds / 3600) * rate
    }
  }

  // Group by day
  const dayMap = new Map<string, { hours: number; amount: number }>()

  for (const entry of filteredEntries) {
    const date = new Date(entry.start_time).toISOString().split('T')[0]

    if (!dayMap.has(date)) {
      dayMap.set(date, { hours: 0, amount: 0 })
    }

    const group = dayMap.get(date)!
    const rate = entry.hourly_rate || entry.project?.hourly_rate || 0
    group.hours += entry.duration_seconds / 3600
    if (entry.is_billable) {
      group.amount += (entry.duration_seconds / 3600) * rate
    }
  }

  return {
    period: {
      start: options.start_date,
      end: options.end_date,
    },
    summary: {
      total_hours: Math.round((totalSeconds / 3600) * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      billable_hours: Math.round((billableSeconds / 3600) * 100) / 100,
      billable_amount: Math.round(billableAmount * 100) / 100,
      non_billable_hours: Math.round(((totalSeconds - billableSeconds) / 3600) * 100) / 100,
    },
    by_project: Array.from(projectMap.values()).map((p) => ({
      project: p.project,
      hours: Math.round(p.hours * 100) / 100,
      amount: Math.round(p.amount * 100) / 100,
    })),
    by_client: Array.from(clientMap.values()).map((c) => ({
      client: c.client,
      hours: Math.round(c.hours * 100) / 100,
      amount: Math.round(c.amount * 100) / 100,
    })),
    by_day: Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        hours: Math.round(data.hours * 100) / 100,
        amount: Math.round(data.amount * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  }
}

export async function exportTimeReport(
  options: {
    start_date: string
    end_date: string
    project_id?: string
    client_id?: string
  },
  format: 'csv' | 'json' = 'csv'
): Promise<{ content: string; filename: string; mimeType: string }> {
  const report = await generateTimeReport(options)

  const startDate = options.start_date.split('T')[0]
  const endDate = options.end_date.split('T')[0]

  if (format === 'json') {
    return {
      content: JSON.stringify(report, null, 2),
      filename: `time-report-${startDate}-to-${endDate}.json`,
      mimeType: 'application/json',
    }
  }

  // CSV format
  const lines: string[] = []

  // Header
  lines.push('Time Report')
  lines.push(`Period: ${startDate} to ${endDate}`)
  lines.push('')

  // Summary
  lines.push('Summary')
  lines.push(`Total Hours,${report.summary.total_hours}`)
  lines.push(`Billable Hours,${report.summary.billable_hours}`)
  lines.push(`Non-Billable Hours,${report.summary.non_billable_hours}`)
  lines.push(`Total Amount,$${report.summary.total_amount.toFixed(2)}`)
  lines.push(`Billable Amount,$${report.summary.billable_amount.toFixed(2)}`)
  lines.push('')

  // By Project
  lines.push('By Project')
  lines.push('Project,Hours,Amount')
  for (const p of report.by_project) {
    lines.push(`"${p.project.name}",${p.hours},$${p.amount.toFixed(2)}`)
  }
  lines.push('')

  // By Client
  lines.push('By Client')
  lines.push('Client,Hours,Amount')
  for (const c of report.by_client) {
    const clientName = c.client?.name || 'No Client'
    lines.push(`"${clientName}",${c.hours},$${c.amount.toFixed(2)}`)
  }
  lines.push('')

  // By Day
  lines.push('By Day')
  lines.push('Date,Hours,Amount')
  for (const d of report.by_day) {
    lines.push(`${d.date},${d.hours},$${d.amount.toFixed(2)}`)
  }

  return {
    content: lines.join('\n'),
    filename: `time-report-${startDate}-to-${endDate}.csv`,
    mimeType: 'text/csv',
  }
}
