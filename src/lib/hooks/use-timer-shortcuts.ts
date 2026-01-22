'use client'

import { useEffect } from 'react'
import { useTimerContext } from '@/contexts'

interface UseTimerShortcutsOptions {
  enabled?: boolean
}

export function useTimerShortcuts(options: UseTimerShortcutsOptions = {}) {
  const { enabled = true } = options
  const {
    timerState,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    discardTimer,
    setIsBillable,
    isBillable,
    descriptionInputRef,
    projectSelectRef,
  } = useTimerContext()

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 's':
          // Start timer when idle
          if (timerState === 'idle') {
            e.preventDefault()
            startTimer()
          }
          break

        case ' ':
          // Pause/Resume when running/paused
          e.preventDefault()
          if (timerState === 'running') {
            pauseTimer()
          } else if (timerState === 'paused') {
            resumeTimer()
          }
          break

        case 'escape':
          // Stop timer (save entry) when running/paused
          if (timerState !== 'idle') {
            e.preventDefault()
            stopTimer()
          }
          break

        case 'd':
          // Discard when paused
          if (timerState === 'paused') {
            e.preventDefault()
            // Confirm before discarding
            if (window.confirm('Discard this timer without saving?')) {
              discardTimer()
            }
          }
          break

        case '/':
          // Focus description input
          e.preventDefault()
          descriptionInputRef.current?.focus()
          break

        case 'p':
          // Focus project dropdown
          e.preventDefault()
          projectSelectRef.current?.click()
          break

        case 'b':
          // Toggle billable
          e.preventDefault()
          setIsBillable(!isBillable)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    enabled,
    timerState,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    discardTimer,
    setIsBillable,
    isBillable,
    descriptionInputRef,
    projectSelectRef,
  ])
}

// Keyboard shortcut definitions for UI display
export const TIMER_SHORTCUTS = {
  start: { key: 'S', description: 'Start timer', when: 'idle' },
  pauseResume: { key: 'Space', description: 'Pause/Resume', when: 'running/paused' },
  stop: { key: 'Esc', description: 'Stop timer', when: 'running/paused' },
  discard: { key: 'D', description: 'Discard', when: 'paused' },
  focusDescription: { key: '/', description: 'Focus description' },
  focusProject: { key: 'P', description: 'Focus project' },
  toggleBillable: { key: 'B', description: 'Toggle billable' },
} as const
