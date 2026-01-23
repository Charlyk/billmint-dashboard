import { createClient } from '@supabase/supabase-js'
import { sendTimerAutoPausedEmail } from './email.service'
import type { Database } from '@/types/database'

// Use service role for cron jobs (bypasses RLS)
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface StaleTimer {
  id: string
  user_id: string
  description: string | null
  project_id: string | null
  start_time: string
  elapsed_seconds: number
  is_paused: boolean
  user: {
    email: string
    full_name: string | null
  }
  user_settings: {
    max_timer_hours: number | null
  } | null
  project: {
    name: string
  } | null
}

export interface AutoPauseResult {
  processed: number
  paused: number
  errors: string[]
}

/**
 * Finds and pauses all timers that have exceeded their user's max_timer_hours setting.
 * Sends email notifications to affected users.
 */
export async function autopauseStaleTimers(): Promise<AutoPauseResult> {
  const result: AutoPauseResult = {
    processed: 0,
    paused: 0,
    errors: [],
  }

  // Fetch all running (non-paused) timers with user settings
  const { data: timers, error: fetchError } = await supabase
    .from('active_timers')
    .select(`
      id,
      user_id,
      description,
      project_id,
      start_time,
      elapsed_seconds,
      is_paused,
      user:users!inner(email, full_name),
      user_settings(max_timer_hours),
      project:projects(name)
    `)
    .eq('is_paused', false) as { data: StaleTimer[] | null; error: Error | null }

  if (fetchError) {
    result.errors.push(`Failed to fetch timers: ${fetchError.message}`)
    return result
  }

  if (!timers || timers.length === 0) {
    return result
  }

  const now = Date.now()

  for (const timer of timers) {
    result.processed++

    // Get user's max timer hours setting (default to 8 if not set)
    const maxTimerHours = timer.user_settings?.max_timer_hours ?? 8

    // Skip if no limit is set (null means unlimited)
    if (maxTimerHours === null) {
      continue
    }

    // Calculate total elapsed time
    const startTime = new Date(timer.start_time).getTime()
    const runningSeconds = Math.floor((now - startTime) / 1000)
    const totalSeconds = timer.elapsed_seconds + runningSeconds
    const totalHours = totalSeconds / 3600

    // Check if timer exceeds the limit
    if (totalHours < maxTimerHours) {
      continue
    }

    // Calculate the exact pause time (when the limit was reached)
    const maxSeconds = maxTimerHours * 3600
    const secondsUntilLimit = maxSeconds - timer.elapsed_seconds
    const pausedAt = new Date(startTime + secondsUntilLimit * 1000).toISOString()

    try {
      // Pause the timer
      const { error: updateError } = await supabase
        .from('active_timers')
        .update({
          is_paused: true,
          paused_at: pausedAt,
          elapsed_seconds: maxSeconds,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', timer.id)

      if (updateError) {
        result.errors.push(`Failed to pause timer ${timer.id}: ${updateError.message}`)
        continue
      }

      // Send email notification
      try {
        // Format duration as "Xh Ym"
        const hours = Math.floor(maxTimerHours)
        const minutes = Math.round((maxTimerHours - hours) * 60)
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
          to: timer.user.email,
          maxHours: maxTimerHours,
          description: timer.description || 'No description',
          projectName: timer.project?.name || 'No project',
          duration,
          startedAt,
        })
      } catch (emailError) {
        // Log email error but don't fail the whole operation
        result.errors.push(`Failed to send email for timer ${timer.id}: ${emailError}`)
      }

      result.paused++
    } catch (error) {
      result.errors.push(`Error processing timer ${timer.id}: ${error}`)
    }
  }

  return result
}
