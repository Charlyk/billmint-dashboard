import { fetcher } from './client'
import type { User, UserSettings, UserWithSettings } from '@/types'

export async function getProfile(): Promise<UserWithSettings> {
  return fetcher<UserWithSettings>('/api/users/me')
}

export async function updateProfile(data: {
  full_name?: string
  company_name?: string
  avatar_url?: string | null
}): Promise<User> {
  return fetcher<User>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteAccount(): Promise<void> {
  await fetcher('/api/users/me', { method: 'DELETE' })
}

export async function getSettings(): Promise<UserSettings> {
  return fetcher<UserSettings>('/api/users/me/settings')
}

export async function updateSettings(data: {
  default_currency?: string
  default_hourly_rate?: number
  week_starts_on?: number
  time_format?: '12h' | '24h'
  date_format?: string
  invoice_prefix?: string
  invoice_notes?: string
  invoice_terms?: string
}): Promise<UserSettings> {
  return fetcher<UserSettings>('/api/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
