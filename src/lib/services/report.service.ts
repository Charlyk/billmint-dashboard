import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { ValidationError } from '@/lib/utils/errors'
import type { TimeReport } from '@/types/api'

export async function generateTimeReport(options: {
  start_date: string
  end_date: string
  project_id?: string
  client_id?: string
}): Promise<TimeReport> {
  const currentUser = await requireAuth()
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
        total_amounts: [],
        billable_hours: 0,
        billable_amounts: [],
        non_billable_hours: 0,
      },
      by_project: [],
      by_client: [],
      by_day: [],
      entries: [],
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

  // CSV format - detailed entries
  const lines: string[] = []

  // Header row
  lines.push('Date,Description,Project,Client,Duration,Billable,Rate,Currency,Amount')

  // Entry rows
  for (const entry of report.entries) {
    const durationHours = (entry.duration_seconds / 3600).toFixed(2)
    const description = entry.description ? `"${entry.description.replace(/"/g, '""')}"` : ''
    const project = entry.project_name ? `"${entry.project_name.replace(/"/g, '""')}"` : ''
    const client = entry.client_name ? `"${entry.client_name.replace(/"/g, '""')}"` : ''
    const billable = entry.is_billable ? 'Yes' : 'No'
    const rate = entry.hourly_rate?.toFixed(2) || ''
    const currency = entry.currency || ''
    const amount = entry.amount.toFixed(2)

    lines.push(`${entry.date},${description},${project},${client},${durationHours},${billable},${rate},${currency},${amount}`)
  }

  return {
    content: lines.join('\n'),
    filename: `time-report-${startDate}-to-${endDate}.csv`,
    mimeType: 'text/csv',
  }
}
