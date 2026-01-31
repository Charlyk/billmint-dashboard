import { fetcher } from './client'
import type { AuthResponse, SessionResponse } from '@/types/api'

export async function signup(
  email: string,
  password: string,
  fullName: string,
  timezone?: string
): Promise<AuthResponse> {
  return fetcher<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName, timezone }),
  })
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
