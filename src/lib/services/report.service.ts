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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('generate_time_report', {
    p_user_id: currentUser.id,
    p_start_date: options.start_date,
    p_end_date: options.end_date,
    p_project_id: options.project_id || null,
    p_client_id: options.client_id || null,
  }) as { data: TimeReport | null; error: Error | null }

  if (error) {
    console.error('[Report] generate_time_report RPC error:', error)
    throw new ValidationError('Failed to generate report')
  }

  if (!data) {
    // Return empty report if no data
    return {
      period: {
        start: options.start_date,
        end: options.end_date,
      },
      summary: {
        total_hours: 0,
        total_amount: 0,
        billable_hours: 0,
        billable_amount: 0,
        non_billable_hours: 0,
      },
      by_project: [],
      by_client: [],
      by_day: [],
    }
  }

  return data
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
