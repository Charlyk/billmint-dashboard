import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { ValidationError, ConflictError, NotFoundError } from '@/lib/utils/errors'
import type { ActiveTimer, TimeEntry } from '@/types/database'
import type { TimerResponse } from '@/types/api'
import { createServiceLogger } from '@/lib/logging/logger'
import { sanitizeError } from '@/lib/logging/sanitizers'

const log = createServiceLogger('timer')

type TimerWithProject = ActiveTimer & { project: { id: string; name: string; color: string } | null }

export async function getActiveTimer(): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_active_timer', {
    p_user_id: currentUser.id,
  }) as { data: TimerResponse | null; error: Error | null }

  if (error) {
    log.error('RPC error getting active timer', {
      operation: 'get_active_timer',
      userId: currentUser.id,
      error: sanitizeError(error),
    })
    throw new ValidationError('Failed to get timer')
  }

  return data || { timer: null, project: null }
}

export async function startTimer(input: {
  description?: string
  project_id?: string | null
  is_billable?: boolean
}): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('start_timer', {
    p_user_id: currentUser.id,
    p_description: input.description || null,
    p_project_id: input.project_id || null,
    p_is_billable: input.is_billable ?? true,
  }) as { data: TimerResponse | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('CONFLICT')) {
      throw new ConflictError('A timer is already running. Stop it first.')
    }
    log.error('RPC error starting timer', {
      operation: 'start_timer',
      userId: currentUser.id,
      error: sanitizeError(error),
    })
    throw new ValidationError('Failed to start timer')
  }

  if (!data) {
    throw new ValidationError('Failed to start timer')
  }

  return data
}

export async function stopTimer(): Promise<{ timeEntry: TimeEntry }> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('stop_timer', {
    p_user_id: currentUser.id,
  }) as { data: { timeEntry: TimeEntry } | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('No active timer to stop')
    }
    log.error('RPC error stopping timer', {
      operation: 'stop_timer',
      userId: currentUser.id,
      error: sanitizeError(error),
    })
    throw new ValidationError('Failed to stop timer')
  }

  if (!data) {
    throw new ValidationError('Failed to stop timer')
  }

  return data
}

export async function pauseTimer(): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('pause_timer', {
    p_user_id: currentUser.id,
  }) as { data: TimerResponse | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('No active timer to pause')
    }
    if (error.message?.includes('CONFLICT')) {
      throw new ConflictError('Timer is already paused')
    }
    log.error('RPC error pausing timer', {
      operation: 'pause_timer',
      userId: currentUser.id,
      error: sanitizeError(error),
    })
    throw new ValidationError('Failed to pause timer')
  }

  if (!data) {
    throw new ValidationError('Failed to pause timer')
  }

  return data
}

export async function resumeTimer(): Promise<TimerResponse> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('resume_timer', {
    p_user_id: currentUser.id,
  }) as { data: TimerResponse | null; error: { message: string } | null }

  if (error) {
    if (error.message?.includes('NOT_FOUND')) {
      throw new NotFoundError('No active timer to resume')
    }
    if (error.message?.includes('CONFLICT')) {
      throw new ConflictError('Timer is not paused')
    }
    log.error('RPC error resuming timer', {
      operation: 'resume_timer',
      userId: currentUser.id,
      error: sanitizeError(error),
    })
    throw new ValidationError('Failed to resume timer')
  }

  if (!data) {
    throw new ValidationError('Failed to resume timer')
  }

  return data
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('sync_timer', {
    p_user_id: currentUser.id,
    p_start_time: input.start_time,
    p_elapsed_seconds: input.elapsed_seconds,
    p_description: input.description || null,
    p_project_id: input.project_id || null,
    p_is_billable: input.is_billable ?? true,
  }) as { data: TimerResponse | null; error: Error | null }

  if (error) {
    log.error('RPC error syncing timer', {
      operation: 'sync_timer',
      userId: currentUser.id,
      error: sanitizeError(error),
    })
    throw new ValidationError('Failed to sync timer')
  }

  if (!data) {
    throw new ValidationError('Failed to sync timer')
  }

  return data
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
