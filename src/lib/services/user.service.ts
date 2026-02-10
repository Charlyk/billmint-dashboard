import { randomInt } from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import { sendAccountDeletionOtpEmail } from '@/lib/services/email.service'
import { updateCustomerEmail } from '@/lib/services/billing.service'
import type { User, UserSettings, UpdateUser, UpdateUserSettings } from '@/types/database'
import type { UserWithSettings } from '@/types/api'

export async function getProfile(): Promise<UserWithSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_user_profile', {
    p_user_id: currentUser.id,
  }) as { data: UserWithSettings | null; error: Error | null }

  if (error) {
    console.error('[User] get_user_profile RPC error:', error)
    throw new ValidationError('Failed to fetch profile')
  }

  if (!data) {
    throw new NotFoundError('User profile')
  }

  return data
}

export async function updateProfile(data: UpdateUser): Promise<User> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', currentUser.id)
    .select()
    .single() as { data: User | null; error: Error | null }

  if (error || !user) {
    throw new ValidationError('Failed to update profile')
  }

  return user
}

export async function getSettings(): Promise<UserSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)('get_user_settings', {
    p_user_id: currentUser.id,
  }) as { data: UserSettings | null; error: Error | null }

  if (error) {
    console.error('[User] get_user_settings RPC error:', error)
    throw new ValidationError('Failed to fetch settings')
  }

  if (!data) {
    return getDefaultSettings(currentUser.id)
  }

  return data
}

export async function updateSettings(
  data: Partial<UpdateUserSettings>
): Promise<UserSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings, error } = await (supabase.rpc as any)('upsert_user_settings', {
    p_user_id: currentUser.id,
    p_default_currency: data.default_currency || null,
    p_default_hourly_rate: data.default_hourly_rate ?? null,
    p_week_starts_on: data.week_starts_on ?? null,
    p_time_format: data.time_format || null,
    p_date_format: data.date_format || null,
    p_invoice_prefix: data.invoice_prefix || null,
    p_invoice_notes: data.invoice_notes ?? null,
    p_invoice_terms: data.invoice_terms ?? null,
    p_max_timer_hours: data.max_timer_hours ?? null,
  }) as { data: UserSettings | null; error: Error | null }

  if (error) {
    console.error('[User] upsert_user_settings RPC error:', error)
    throw new ValidationError('Failed to update settings')
  }

  if (!settings) {
    throw new ValidationError('Failed to update settings')
  }

  return settings
}

export async function updateBillingDefaults(
  data: { default_currency?: string; default_hourly_rate?: number; billing_email?: string | null }
): Promise<UserSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings, error } = await (supabase.rpc as any)('update_billing_defaults', {
    p_user_id: currentUser.id,
    p_default_currency: data.default_currency || null,
    p_default_hourly_rate: data.default_hourly_rate ?? null,
    p_billing_email: data.billing_email ?? null,
  }) as { data: UserSettings | null; error: Error | null }

  if (error) {
    console.error('[User] update_billing_defaults RPC error:', error)
    throw new ValidationError('Failed to update billing defaults')
  }

  if (!settings) {
    throw new ValidationError('Failed to update billing defaults')
  }

  // Sync billing email to Stripe customer
  if (data.billing_email !== undefined && currentUser.stripe_customer_id) {
    try {
      await updateCustomerEmail(currentUser.stripe_customer_id, data.billing_email || currentUser.email)
    } catch (stripeError) {
      console.error('[User] Failed to update Stripe customer email:', stripeError)
    }
  }

  return settings
}

export async function updateAppSettings(
  data: { time_format?: '12h' | '24h'; week_starts_on?: number; max_timer_hours?: number | null; timezone?: string }
): Promise<UserSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings, error } = await (supabase.rpc as any)('update_app_settings', {
    p_user_id: currentUser.id,
    p_time_format: data.time_format || null,
    p_week_starts_on: data.week_starts_on ?? null,
    p_max_timer_hours: data.max_timer_hours ?? null,
    p_timezone: data.timezone || null,
  }) as { data: UserSettings | null; error: Error | null }

  if (error) {
    console.error('[User] update_app_settings RPC error:', error)
    throw new ValidationError('Failed to update app settings')
  }

  if (!settings) {
    throw new ValidationError('Failed to update app settings')
  }

  return settings
}

export async function dismissOnboarding(): Promise<UserSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings, error } = await (supabase.rpc as any)('dismiss_onboarding', {
    p_user_id: currentUser.id,
  }) as { data: UserSettings | null; error: Error | null }

  if (error) {
    console.error('[User] dismiss_onboarding RPC error:', error)
    throw new ValidationError('Failed to dismiss onboarding')
  }

  if (!settings) {
    throw new ValidationError('Failed to dismiss onboarding')
  }

  return settings
}

export async function requestAccountDeletion(): Promise<void> {
  const currentUser = await requireAuth()
  const adminClient = createAdminClient()

  // Generate a 6-digit OTP
  const otpCode = randomInt(100000, 999999).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

  // Delete any existing OTPs for this user
  await adminClient
    .from('account_deletion_otps')
    .delete()
    .eq('user_id', currentUser.id)

  // Store the OTP
  const { error: insertError } = await adminClient
    .from('account_deletion_otps')
    .insert({
      user_id: currentUser.id,
      email: currentUser.email,
      otp_code: otpCode,
      expires_at: expiresAt.toISOString(),
    } as never)

  if (insertError) {
    console.error('[User] Failed to create deletion OTP:', insertError)
    throw new ValidationError('Failed to send verification code')
  }

  // Send OTP email
  try {
    await sendAccountDeletionOtpEmail({ to: currentUser.email, otpCode })
  } catch (error) {
    console.error('[User] Failed to send deletion OTP email:', error)
    throw new ValidationError('Failed to send verification code')
  }
}

interface AccountDeletionOtp {
  user_id: string
  email: string
  otp_code: string
  expires_at: string
  used_at: string | null
}

export async function confirmAccountDeletion(otpCode: string): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Verify the OTP
  const { data: otpData, error: otpError } = await adminClient
    .from('account_deletion_otps')
    .select('user_id, email, otp_code, expires_at, used_at')
    .eq('user_id', currentUser.id)
    .eq('otp_code', otpCode)
    .single() as { data: AccountDeletionOtp | null; error: unknown }

  if (otpError || !otpData) {
    throw new ValidationError('Invalid verification code')
  }

  // Check if OTP is expired
  if (new Date(otpData.expires_at) < new Date()) {
    throw new ValidationError('Verification code has expired')
  }

  // Check if OTP was already used
  if (otpData.used_at) {
    throw new ValidationError('Verification code has already been used')
  }

  // Mark OTP as used
  await adminClient
    .from('account_deletion_otps')
    .update({ used_at: new Date().toISOString() } as never)
    .eq('user_id', currentUser.id)
    .eq('otp_code', otpCode)

  // Delete the account data from public schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.rpc as any)('delete_user_account', {
    p_user_id: currentUser.id,
  })

  if (error) {
    console.error('[User] delete_user_account RPC error:', error)
    throw new ValidationError('Failed to delete account')
  }

  // Delete the user from auth.users using admin client
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(currentUser.id)

  if (authDeleteError) {
    console.error('[User] Failed to delete auth user:', authDeleteError)
    // Don't throw here - the user data is already deleted, auth record will be orphaned but harmless
  }

  // Sign out the user (clears session)
  await supabase.auth.signOut()
}

export async function getUserTier(): Promise<User['tier']> {
  const currentUser = await requireAuth()
  return currentUser.tier
}

export async function isPaidUser(): Promise<boolean> {
  const tier = await getUserTier()
  return tier !== 'free'
}

function getDefaultSettings(userId: string): UserSettings {
  return {
    user_id: userId,
    default_currency: 'USD',
    default_hourly_rate: null,
    week_starts_on: 0,
    time_format: '12h',
    date_format: 'MM/DD/YYYY',
    invoice_prefix: 'INV-',
    invoice_notes: null,
    invoice_terms: null,
    max_timer_hours: 8,
    timezone: 'UTC',
    logo_url: null,
    billing_email: null,
    onboarding_dismissed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
