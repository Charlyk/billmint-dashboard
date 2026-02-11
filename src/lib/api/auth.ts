import { fetcher } from './client'
import type { AuthResponse, SessionResponse } from '@/types/api'
import { analytics } from '@/lib/analytics/events'

// Note: first_project_created, first_timer_started, first_invoice_sent funnel events
// are defined in analytics/events.ts but require server-side detection (DB count queries)
// and posthog-node for reliable tracking. PostHog's built-in "First time event" filter
// provides equivalent funnel analysis using the standard CRUD events.

export async function signup(
  email: string,
  password: string,
  fullName: string,
  timezone?: string
): Promise<AuthResponse> {
  const result = await fetcher<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName, timezone }),
  })
  analytics.signupCompleted()
  return result
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return fetcher<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(): Promise<void> {
  await fetcher('/api/auth/logout', { method: 'POST' })
}

export async function getSession(): Promise<SessionResponse> {
  return fetcher<SessionResponse>('/api/auth/session')
}

export async function resetPassword(email: string): Promise<void> {
  await fetcher('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function updatePasswordWithToken(token: string, password: string): Promise<void> {
  await fetcher('/api/auth/reset-password', {
    method: 'PATCH',
    body: JSON.stringify({ token, password }),
  })
}

export async function signInWithGoogle(): Promise<{ url: string }> {
  return fetcher<{ url: string }>('/api/auth/google')
}

export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  return fetcher<{ success: boolean; message: string }>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
  return fetcher<{ success: boolean; message: string }>('/api/auth/verify-email', {
    method: 'PUT',
  })
}
