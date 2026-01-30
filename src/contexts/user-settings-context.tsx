'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { userApi } from '@/lib/api'
import type { UserSettings } from '@/types'

type TimeFormat = '12h' | '24h'

interface UserSettingsContextType {
  settings: UserSettings | null
  isLoading: boolean
  timeFormat: TimeFormat
  updateTimeFormat: (format: TimeFormat) => Promise<void>
  refetchSettings: () => Promise<void>
}

const UserSettingsContext = createContext<UserSettingsContextType | null>(null)

// Default to 12h for AM/PM (for existing accounts as requested)
const DEFAULT_TIME_FORMAT: TimeFormat = '12h'

// Timezones that typically use 24-hour format
const TIMEZONES_24H = [
  'Europe/',
  'Africa/',
  'Asia/',
  'Australia/',
  'Pacific/Auckland',
  'Atlantic/',
]

/**
 * Detect time format preference from timezone
 */
function getTimeFormatFromTimezone(): TimeFormat {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    // Check if timezone is in a 24-hour region
    if (TIMEZONES_24H.some((tz) => timezone.startsWith(tz))) {
      return '24h'
    }

    return '12h'
  } catch {
    return '12h'
  }
}

interface UserSettingsProviderProps {
  children: ReactNode
  initialSettings?: UserSettings | null
}

export function UserSettingsProvider({ children, initialSettings }: UserSettingsProviderProps) {
  const [settings, setSettings] = useState<UserSettings | null>(initialSettings ?? null)
  const [isLoading, setIsLoading] = useState(!initialSettings)
  const hasCheckedTimezone = useRef(false)

  // Fetch settings on mount if not provided initially
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await userApi.getSettings()
      setSettings(data)
    } catch (error) {
      console.error('Failed to fetch user settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialSettings) {
      fetchSettings()
    }
  }, [initialSettings, fetchSettings])

  // For Google OAuth users (or any new user whose timezone wasn't set),
  // check if we should update time_format based on detected timezone.
  // This only runs once per session and only for new accounts (created within last hour).
  useEffect(() => {
    if (hasCheckedTimezone.current || !settings) return

    hasCheckedTimezone.current = true

    // Check if this is a recently created account (within last hour)
    const createdAt = new Date(settings.created_at).getTime()
    const oneHourAgo = Date.now() - 60 * 60 * 1000

    if (createdAt < oneHourAgo) return // Not a new account

    // Detect timezone-based time format
    const detectedFormat = getTimeFormatFromTimezone()

    // If settings are still at default and detected format differs, update
    if (settings.time_format === '12h' && detectedFormat === '24h') {
      userApi.updateSettings({ time_format: detectedFormat })
        .then((updated) => setSettings(updated))
        .catch((error) => console.error('Failed to update time format:', error))
    }
  }, [settings])

  const updateTimeFormat = useCallback(async (format: TimeFormat) => {
    // Optimistic update
    setSettings((prev) => prev ? { ...prev, time_format: format } : null)

    try {
      const updated = await userApi.updateSettings({ time_format: format })
      setSettings(updated)
    } catch (error) {
      // Revert on error
      setSettings((prev) => prev ? { ...prev, time_format: prev.time_format } : null)
      throw error
    }
  }, [])

  const timeFormat = settings?.time_format ?? DEFAULT_TIME_FORMAT

  const value: UserSettingsContextType = {
    settings,
    isLoading,
    timeFormat,
    updateTimeFormat,
    refetchSettings: fetchSettings,
  }

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}

/**
 * Hook to get just the time format - convenience hook
 */
export function useTimeFormat(): TimeFormat {
  const context = useContext(UserSettingsContext)
  // Return default if context is not available (SSR or outside provider)
  return context?.timeFormat ?? DEFAULT_TIME_FORMAT
}

/**
 * Hook to get the user's timezone setting
 * Falls back to browser timezone if not set
 */
export function useTimezone(): string {
  const context = useContext(UserSettingsContext)
  const browserTimezone = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC'
  return context?.settings?.timezone ?? browserTimezone
}
