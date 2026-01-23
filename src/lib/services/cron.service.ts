import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { sendTimerAutoPausedEmail } from './email.service'
import type { Database } from '@/types/database'

// Lazy initialization to avoid build-time env var issues
let supabaseInstance: SupabaseClient<Database> | null = null

function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseInstance
}

// Type for the result returned by the autopause_stale_timers Supabase function
interface PausedTimerResult {
  timer_id: string
  user_email: string
  user_full_name: string | null
  description: string | null
  project_name: string | null
  start_time: string
  max_timer_hours: number
  paused_at: string
  capped_elapsed_seconds: number
}

export interface AutoPauseResult {
  processed: number
  paused: number
  errors: string[]
}

/**
 * Finds and pauses all timers that have exceeded their user's max_timer_hours setting.
 * Uses a Supabase function for atomic operation, then sends email notifications.
 */
export async function autopauseStaleTimers(): Promise<AutoPauseResult> {
  const result: AutoPauseResult = {
    processed: 0,
    paused: 0,
    errors: [],
  }

  const supabase = getSupabase()

  // Call the Supabase function that atomically finds and pauses stale timers
  const { data: pausedTimers, error: rpcError } = await supabase
    .rpc('autopause_stale_timers') as { data: PausedTimerResult[] | null; error: Error | null }

  if (rpcError) {
    result.errors.push(`Failed to execute autopause function: ${rpcError.message}`)
    console.error('[Cron] RPC error:', rpcError)
    return result
  }

  if (!pausedTimers || pausedTimers.length === 0) {
    return result
  }

  result.paused = pausedTimers.length
  result.processed = pausedTimers.length

  // Send email notifications for each paused timer
  for (const timer of pausedTimers) {
    try {
      // Format duration as "Xh Ym"
      const hours = Math.floor(timer.max_timer_hours)
      const minutes = Math.round((timer.max_timer_hours - hours) * 60)
      const duration = `${hours}h ${minutes.toString().padStart(2, '0')}m`

      // Format start time as "Jan 20 at 9:00 AM"
      const startDate = new Date(timer.start_time)
      const startedAt = startDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }) + ' at ' + startDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })

      await sendTimerAutoPausedEmail({
        to: timer.user_email,
        maxHours: timer.max_timer_hours,
        description: timer.description || 'No description',
        projectName: timer.project_name || 'No project',
        duration,
        startedAt,
      })
    } catch (emailError) {
      // Log email error but don't fail the whole operation
      const errorMessage = emailError instanceof Error ? emailError.message : String(emailError)
      console.error(`[Cron] Failed to send email for timer ${timer.timer_id}:`, emailError)
      result.errors.push(`Failed to send email for timer ${timer.timer_id}: ${errorMessage}`)
    }
  }

  return result
}
