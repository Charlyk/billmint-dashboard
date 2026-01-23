import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { ValidationError, ConflictError } from '@/lib/utils/errors'
import { createTimeEntry } from './time-entry.service'
import type { ActiveTimer, UserSettings } from '@/types/database'
import type { TimerResponse } from '@/types/api'

type TimerWithProject = ActiveTimer & { project: { id: string; name: string; color: string } | null }

/**
 * Calculates total elapsed time for a timer in seconds
 */
function calculateElapsedSeconds(timer: ActiveTimer): number {
  let totalSeconds = timer.elapsed_seconds || 0

  if (!timer.is_paused && timer.start_time) {
    const startTime = new Date(timer.start_time).getTime()
    const now = Date.now()
    totalSeconds += Math.floor((now - startTime) / 1000)
  }

  return totalSeconds
}

/**
 * Checks if a timer should be auto-paused based on user's max_timer_hours setting.
 * Returns the paused_at timestamp if auto-pause should trigger, null otherwise.
 */
function getAutoPauseTimestamp(timer: ActiveTimer, maxTimerHours: number | null): string | null {
  // No auto-pause if setting is null or timer is already paused
  if (maxTimerHours === null || timer.is_paused) {
    return null
  }

  const maxSeconds = maxTimerHours * 3600
  const elapsedSeconds = calculateElapsedSeconds(timer)

  if (elapsedSeconds >= maxSeconds) {
    // Calculate the exact moment when max duration was reached
    // paused_at = start_time + (max_seconds - already_accumulated_seconds)
    const startTime = new Date(timer.start_time).getTime()
    const secondsUntilLimit = maxSeconds - (timer.elapsed_seconds || 0)
    const pausedAt = new Date(startTime + secondsUntilLimit * 1000)
    return pausedAt.toISOString()
  }

  return null
}

export async function getActiveTimer(): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: timer } = await supabase
    .from('active_timers')
    .select(
      `
      *,
      project:projects(id, name, color)
    `
    )
    .eq('user_id', currentUser.id)
    .single() as { data: TimerWithProject | null }

  if (!timer) {
    return { timer: null, project: null }
  }

  // Check if auto-pause should trigger
  const { data: settings } = await supabase
    .from('user_settings')
    .select('max_timer_hours')
    .eq('user_id', currentUser.id)
    .single() as { data: Pick<UserSettings, 'max_timer_hours'> | null }

  const maxTimerHours = settings?.max_timer_hours ?? null
  const autoPauseAt = getAutoPauseTimestamp(timer, maxTimerHours)

  if (autoPauseAt) {
    // Calculate elapsed time at the pause point (exactly max_timer_hours)
    const maxSeconds = maxTimerHours! * 3600

    const { data: pausedTimer } = await supabase
      .from('active_timers')
      .update({
        is_paused: true,
        paused_at: autoPauseAt,
        elapsed_seconds: maxSeconds,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', timer.id)
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .single() as { data: TimerWithProject | null }

    if (pausedTimer) {
      return {
        timer: pausedTimer,
        project: pausedTimer.project || null,
        autoPaused: true, // Signal to client that timer was auto-paused
      }
    }
  }

  return {
    timer,
    project: timer.project || null,
  }
}

export async function startTimer(input: {
  description?: string
  project_id?: string | null
  is_billable?: boolean
}): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Check if there's already an active timer
  const { data: existingTimer } = await supabase
    .from('active_timers')
    .select('id')
    .eq('user_id', currentUser.id)
    .single()

  if (existingTimer) {
    throw new ConflictError('A timer is already running. Stop it first.')
  }

  const { data: timer, error } = await supabase
    .from('active_timers')
    .insert({
      user_id: currentUser.id,
      description: input.description || null,
      project_id: input.project_id || null,
      is_billable: input.is_billable ?? true,
      start_time: new Date().toISOString(),
      elapsed_seconds: 0,
      is_paused: false,
    } as never)
    .select(
      `
      *,
      project:projects(id, name, color)
    `
    )
    .single() as { data: TimerWithProject | null; error: Error | null }

  if (error || !timer) {
    throw new ValidationError('Failed to start timer')
  }

  return {
    timer,
    project: timer.project || null,
  }
}

export async function stopTimer(): Promise<{
  timeEntry: Awaited<ReturnType<typeof createTimeEntry>>
}> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: timer } = await supabase
    .from('active_timers')
    .select('*')
    .eq('user_id', currentUser.id)
    .single() as { data: ActiveTimer | null }

  if (!timer) {
    throw new ValidationError('No active timer to stop')
  }

  // Calculate total elapsed time
  let totalSeconds = timer.elapsed_seconds || 0
  if (!timer.is_paused && timer.start_time) {
    const startTime = new Date(timer.start_time).getTime()
    const now = Date.now()
    totalSeconds += Math.floor((now - startTime) / 1000)
  }

  // Create time entry from timer
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - totalSeconds * 1000)

  const timeEntry = await createTimeEntry({
    description: timer.description,
    project_id: timer.project_id,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    duration_seconds: totalSeconds,
    is_billable: timer.is_billable,
  })

  // Delete the timer
  await supabase.from('active_timers').delete().eq('id', timer.id)

  return { timeEntry }
}

export async function pauseTimer(): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: timer } = await supabase
    .from('active_timers')
    .select('*')
    .eq('user_id', currentUser.id)
    .single() as { data: ActiveTimer | null }

  if (!timer) {
    throw new ValidationError('No active timer to pause')
  }

  if (timer.is_paused) {
    throw new ValidationError('Timer is already paused')
  }

  // Calculate elapsed time since start
  const startTime = new Date(timer.start_time).getTime()
  const now = Date.now()
  const newElapsed = (timer.elapsed_seconds || 0) + Math.floor((now - startTime) / 1000)

  const { data: updatedTimer, error } = await supabase
    .from('active_timers')
    .update({
      is_paused: true,
      paused_at: new Date().toISOString(),
      elapsed_seconds: newElapsed,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', timer.id)
    .select(
      `
      *,
      project:projects(id, name, color)
    `
    )
    .single() as { data: TimerWithProject | null; error: Error | null }

  if (error || !updatedTimer) {
    throw new ValidationError('Failed to pause timer')
  }

  return {
    timer: updatedTimer,
    project: updatedTimer.project || null,
  }
}

export async function resumeTimer(): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: timer } = await supabase
    .from('active_timers')
    .select('*')
    .eq('user_id', currentUser.id)
    .single() as { data: ActiveTimer | null }

  if (!timer) {
    throw new ValidationError('No active timer to resume')
  }

  if (!timer.is_paused) {
    throw new ValidationError('Timer is not paused')
  }

  const { data: updatedTimer, error } = await supabase
    .from('active_timers')
    .update({
      is_paused: false,
      paused_at: null,
      start_time: new Date().toISOString(), // Reset start time, elapsed_seconds holds accumulated time
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', timer.id)
    .select(
      `
      *,
      project:projects(id, name, color)
    `
    )
    .single() as { data: TimerWithProject | null; error: Error | null }

  if (error || !updatedTimer) {
    throw new ValidationError('Failed to resume timer')
  }

  return {
    timer: updatedTimer,
    project: updatedTimer.project || null,
  }
}

export async function discardTimer(): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('active_timers')
    .delete()
    .eq('user_id', currentUser.id)

  if (error) {
    throw new ValidationError('Failed to discard timer')
  }
}

export async function syncTimer(input: {
  description?: string
  project_id?: string | null
  is_billable?: boolean
  start_time: string
  elapsed_seconds: number
}): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Upsert the timer - create if doesn't exist, update if it does
  const { data: existingTimer } = await supabase
    .from('active_timers')
    .select('id')
    .eq('user_id', currentUser.id)
    .single() as { data: { id: string } | null }

  let timer: TimerWithProject

  if (existingTimer) {
    const { data, error } = await supabase
      .from('active_timers')
      .update({
        description: input.description || null,
        project_id: input.project_id || null,
        is_billable: input.is_billable ?? true,
        start_time: input.start_time,
        elapsed_seconds: input.elapsed_seconds,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', existingTimer.id)
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .single() as { data: TimerWithProject | null; error: Error | null }

    if (error || !data) {
      throw new ValidationError('Failed to sync timer')
    }
    timer = data
  } else {
    const { data, error } = await supabase
      .from('active_timers')
      .insert({
        user_id: currentUser.id,
        description: input.description || null,
        project_id: input.project_id || null,
        is_billable: input.is_billable ?? true,
        start_time: input.start_time,
        elapsed_seconds: input.elapsed_seconds,
        is_paused: false,
      } as never)
      .select(
        `
        *,
        project:projects(id, name, color)
      `
      )
      .single() as { data: TimerWithProject | null; error: Error | null }

    if (error || !data) {
      throw new ValidationError('Failed to sync timer')
    }
    timer = data
  }

  return {
    timer,
    project: timer.project || null,
  }
}

export async function updateTimerDetails(input: {
  description?: string
  project_id?: string | null
  is_billable?: boolean
}): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: timer, error } = await supabase
    .from('active_timers')
    .update({
      description: input.description,
      project_id: input.project_id,
      is_billable: input.is_billable,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', currentUser.id)
    .select(
      `
      *,
      project:projects(id, name, color)
    `
    )
    .single() as { data: TimerWithProject | null; error: Error | null }

  if (error || !timer) {
    throw new ValidationError('No active timer to update')
  }

  return {
    timer,
    project: timer.project || null,
  }
}
