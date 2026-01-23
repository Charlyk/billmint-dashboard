import { createClient } from '@/lib/supabase/server'
import { requireAuth } from './auth.service'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import type { User, UserSettings, UpdateUser, UpdateUserSettings } from '@/types/database'
import type { UserWithSettings } from '@/types/api'

export async function getProfile(): Promise<UserWithSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single() as { data: User | null; error: Error | null }

  if (userError || !user) {
    throw new NotFoundError('User profile')
  }

  const { data: settings, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', currentUser.id)
    .single() as { data: UserSettings | null; error: Error | null }

  if (settingsError || !settings) {
    // Create default settings if they don't exist
    const { data: newSettings } = await supabase
      .from('user_settings')
      .insert({ user_id: currentUser.id } as never)
      .select()
      .single() as { data: UserSettings | null }

    return {
      ...user,
      settings: newSettings || getDefaultSettings(currentUser.id),
    }
  }

  return {
    ...user,
    settings,
  }
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

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', currentUser.id)
    .single() as { data: UserSettings | null; error: Error | null }

  if (error || !data) {
    // Create default settings if they don't exist
    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert({ user_id: currentUser.id } as never)
      .select()
      .single() as { data: UserSettings | null; error: Error | null }

    if (createError || !newSettings) {
      return getDefaultSettings(currentUser.id)
    }

    return newSettings
  }

  return data
}

export async function updateSettings(
  data: Partial<UpdateUserSettings>
): Promise<UserSettings> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  const { data: settings, error } = await supabase
    .from('user_settings')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('user_id', currentUser.id)
    .select()
    .single() as { data: UserSettings | null; error: Error | null }

  if (error) {
    // If settings don't exist, create them with the provided data
    const { data: newSettings, error: createError } = await supabase
      .from('user_settings')
      .insert({
        user_id: currentUser.id,
        ...data,
      } as never)
      .select()
      .single() as { data: UserSettings | null; error: Error | null }

    if (createError || !newSettings) {
      throw new ValidationError('Failed to update settings')
    }

    return newSettings
  }

  return settings as UserSettings
}

export async function deleteAccount(): Promise<void> {
  const currentUser = await requireAuth()
  const supabase = await createClient()

  // Delete user settings
  await supabase.from('user_settings').delete().eq('user_id', currentUser.id)

  // Delete user profile (this should cascade to other data via RLS policies)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', currentUser.id)

  if (error) {
    throw new ValidationError('Failed to delete account')
  }

  // Sign out the user
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
    max_timer_hours: 8, // Default to 8 hours auto-pause
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
