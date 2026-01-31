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
  max_timer_hours?: number | null
}): Promise<UserSettings> {
  return fetcher<UserSettings>('/api/users/me/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function updateBillingDefaults(data: {
  default_currency?: string
  default_hourly_rate?: number
}): Promise<UserSettings> {
  return fetcher<UserSettings>('/api/users/me/settings/billing', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function updateAppSettings(data: {
  time_format?: '12h' | '24h'
  week_starts_on?: number
  max_timer_hours?: number | null
  timezone?: string
}): Promise<UserSettings> {
  return fetcher<UserSettings>('/api/users/me/settings/app', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function uploadLogo(file: File): Promise<{ logo_url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/users/me/logo', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to upload logo')
  }

  const result = await response.json()
  return result.data
}

export async function deleteLogo(): Promise<void> {
  const response = await fetch('/api/users/me/logo', {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to delete logo')
  }
}
