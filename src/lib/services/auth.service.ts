import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError, ValidationError, ConflictError } from '@/lib/utils/errors'
import type { User } from '@/types/database'
import type { AuthResponse, SessionResponse } from '@/types/api'

// Timezones that typically use 24-hour format
const TIMEZONES_24H = [
  'Europe/',
  'Africa/',
  'Asia/',
  'Australia/',
  'Pacific/Auckland',
  'Atlantic/',
]

// Timezones that typically use 12-hour format
const TIMEZONES_12H = ['America/', 'Pacific/']

/**
 * Detect time format preference from timezone
 */
function getTimeFormatFromTimezone(timezone?: string): '12h' | '24h' {
  if (!timezone) return '12h' // Default to 12h

  // Check if timezone is in a 12-hour region
  if (TIMEZONES_12H.some((tz) => timezone.startsWith(tz) && !timezone.startsWith('Pacific/Auckland'))) {
    return '12h'
  }

  // Check if timezone is in a 24-hour region
  if (TIMEZONES_24H.some((tz) => timezone.startsWith(tz))) {
    return '24h'
  }

  // Default to 12h for unknown timezones
  return '12h'
}

export async function signup(
  email: string,
  password: string,
  fullName: string,
  timezone?: string
): Promise<AuthResponse> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      throw new ConflictError('An account with this email already exists')
    }
    throw new ValidationError(error.message)
  }

  if (!data.user || !data.session) {
    throw new ValidationError('Failed to create account')
  }

  // Get the user profile (created by database trigger)
  const user = await getUser(data.user.id)

  // Set time_format based on timezone if provided
  if (timezone) {
    const timeFormat = getTimeFormatFromTimezone(timezone)
    await supabase
      .from('user_settings')
      .update({ time_format: timeFormat } as never)
      .eq('user_id', data.user.id)
  }

  return {
    user,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at ?? 0,
    },
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const user = await getUser(data.user.id)

  return {
    user,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at ?? 0,
    },
  }
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Logout error:', error)
  }
}

export async function getSession(): Promise<SessionResponse> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { user: null, session: null }
  }

  const user = await getUser(session.user.id)

  return {
    user,
    session: {
      access_token: session.access_token,
      expires_at: session.expires_at ?? 0,
    },
  }
}

export async function getCurrentUser(): Promise<User> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    throw new UnauthorizedError('Not authenticated')
  }

  return getUser(authUser.id)
}

export async function getUser(userId: string): Promise<User> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new UnauthorizedError('User not found')
  }

  return data
}

export async function resetPassword(email: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/update`,
  })

  if (error) {
    // Don't reveal if email exists or not
    console.error('Reset password error:', error)
  }
}

export async function updatePassword(password: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    throw new ValidationError('Failed to update password')
  }
}

export async function signInWithGoogle(): Promise<{ url: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    },
  })

  if (error) {
    throw new ValidationError('Failed to initiate Google sign in')
  }

  return { url: data.url }
}

export async function requireAuth(): Promise<User> {
  try {
    return await getCurrentUser()
  } catch {
    throw new UnauthorizedError('Authentication required')
  }
}

export async function requirePaidUser(): Promise<User> {
  const user = await requireAuth()

  if (user.tier === 'free') {
    throw new UnauthorizedError('This feature requires a paid subscription')
  }

  return user
}
