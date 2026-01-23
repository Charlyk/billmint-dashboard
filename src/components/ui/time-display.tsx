'use client'

import { useMemo } from 'react'
import { useTimeFormat } from '@/contexts/user-settings-context'

/**
 * Format time based on time format preference
 */
function formatTimeWithPreference(date: Date, use24Hour: boolean): string {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  })
}

interface TimeDisplayProps {
  date: Date | string
  className?: string
}

/**
 * Displays time based on user's time_format setting (12h or 24h)
 */
export function TimeDisplay({ date, className }: TimeDisplayProps) {
  const timeFormat = useTimeFormat()
  const use24Hour = timeFormat === '24h'

  const formattedTime = useMemo(() => {
    const d = typeof date === 'string' ? new Date(date) : date
    return formatTimeWithPreference(d, use24Hour)
  }, [date, use24Hour])

  return <span className={className}>{formattedTime}</span>
}

interface TimeRangeDisplayProps {
  startTime: Date | string
  endTime?: Date | string | null
  className?: string
}

/**
 * Displays a time range based on user's time_format setting
 */
export function TimeRangeDisplay({ startTime, endTime, className }: TimeRangeDisplayProps) {
  const timeFormat = useTimeFormat()
  const use24Hour = timeFormat === '24h'

  const formattedRange = useMemo(() => {
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime
    const startFormatted = formatTimeWithPreference(start, use24Hour)

    if (!endTime) {
      return `${startFormatted} – –`
    }

    const end = typeof endTime === 'string' ? new Date(endTime) : endTime
    const endFormatted = formatTimeWithPreference(end, use24Hour)

    return `${startFormatted} – ${endFormatted}`
  }, [startTime, endTime, use24Hour])

  return <span className={className}>{formattedRange}</span>
}
