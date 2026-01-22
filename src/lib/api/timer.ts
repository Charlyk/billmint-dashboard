import { fetcher } from './client'
import type { TimerResponse, TimeEntry } from '@/types'
import type { StartTimerInput, SyncTimerInput } from '@/lib/utils/validation'

export async function getTimer(): Promise<TimerResponse> {
  return fetcher<TimerResponse>('/api/timer')
}

export async function startTimer(data: StartTimerInput): Promise<TimerResponse> {
  return fetcher<TimerResponse>('/api/timer/start', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function stopTimer(): Promise<{ timeEntry: TimeEntry }> {
  return fetcher<{ timeEntry: TimeEntry }>('/api/timer/stop', {
    method: 'POST',
  })
}

export async function pauseTimer(): Promise<TimerResponse> {
  return fetcher<TimerResponse>('/api/timer/pause', { method: 'POST' })
}

export async function resumeTimer(): Promise<TimerResponse> {
  return fetcher<TimerResponse>('/api/timer/resume', { method: 'POST' })
}

export async function discardTimer(): Promise<void> {
  await fetcher('/api/timer/discard', { method: 'POST' })
}

export async function syncTimer(data: SyncTimerInput): Promise<TimerResponse> {
  return fetcher<TimerResponse>('/api/timer/sync', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTimer(data: {
  description?: string
  project_id?: string | null
  is_billable?: boolean
}): Promise<TimerResponse> {
  return fetcher<TimerResponse>('/api/timer', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
