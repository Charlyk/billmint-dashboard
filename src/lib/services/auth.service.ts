import { randomBytes } from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { UnauthorizedError, ValidationError, ConflictError } from '@/lib/utils/errors'
import { sendPasswordResetEmail, sendWelcomeEmail } from '@/lib/services/email.service'
import type { User } from '@/types/database'
import type { AuthResponse, SessionResponse } from '@/types/api'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://billmint.io'

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

  // Send welcome email (don't block on failure)
  sendWelcomeEmail({ to: email, name: fullName }).catch((error) => {
    console.error('Failed to send welcome email:', error)
  })

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

// Type for password reset tokens (not yet in generated types)
interface PasswordResetToken {
  email: string
  token: string
  expires_at: string
  used_at: string | null
}

export async function resetPassword(email: string): Promise<void> {
  // Use admin client to bypass RLS (user is not authenticated during password reset)
  const adminClient = createAdminClient()

  // Generate a secure random token
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

  // Delete any existing tokens for this email
  await adminClient
    .from('password_reset_tokens')
    .delete()
    .eq('email', email.toLowerCase())

  // Store the token
  const { error: insertError } = await adminClient
    .from('password_reset_tokens')
    .insert({
      email: email.toLowerCase(),
      token,
      expires_at: expiresAt.toISOString(),
    } as never)

  if (insertError) {
    console.error('Failed to create reset token:', insertError)
    // Don't reveal error to user
    return
  }

  // Send branded email
  const resetUrl = `${APP_URL}/reset-password/update?token=${token}`
  try {
    await sendPasswordResetEmail({ to: email, resetUrl })
  } catch (error) {
    console.error('Failed to send reset email:', error)
    // Don't reveal error to user
  }
}

export async function verifyResetToken(token: string): Promise<string | null> {
  // Use admin client to bypass RLS
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('password_reset_tokens')
    .select('email, expires_at, used_at')
    .eq('token', token)
    .single() as { data: PasswordResetToken | null; error: unknown }

  if (error || !data) {
    return null
  }

  // Check if token is expired
  if (new Date(data.expires_at) < new Date()) {
    return null
  }

  // Check if token was already used
  if (data.used_at) {
    return null
  }

  return data.email
}

export async function updatePasswordWithToken(token: string, password: string): Promise<void> {
  // Verify the token first
  const email = await verifyResetToken(token)
  if (!email) {
    throw new ValidationError('Invalid or expired reset link')
  }

  // Use admin client for all operations (user is not authenticated)
  const adminClient = createAdminClient()

  // Get user by email
  const { data: userData, error: userError } = await adminClient.auth.admin.listUsers()
  if (userError) {
    throw new ValidationError('Failed to update password')
  }

  const user = userData.users.find((u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) {
    throw new ValidationError('User not found')
  }

  // Update the user's password
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
    password,
  })

  if (updateError) {
    throw new ValidationError('Failed to update password')
  }

  // Mark token as used
  await adminClient
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() } as never)
    .eq('token', token)
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
