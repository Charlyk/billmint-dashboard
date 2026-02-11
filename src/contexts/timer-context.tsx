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
import { useSWRConfig } from 'swr'
import { timerApi, isApiError } from '@/lib/api'
import { toastManager } from '@/components/ui/toast'
import { formatDurationHuman } from '@/lib/utils/date'
import type { Project, ActiveTimer } from '@/types'

// Key for onboarding stats SWR cache (must match the key in onboarding-checklist.tsx)
const ONBOARDING_STATS_KEY = 'onboarding-stats'

type TimerStateValue = 'idle' | 'running' | 'paused'

interface TimerState {
  isRunning: boolean
  isPaused: boolean
  isAutoPaused: boolean
  startTime: string | null
  elapsedSeconds: number
  description: string
  projectId: string | null
  project: Pick<Project, 'id' | 'name' | 'color'> | null
  isBillable: boolean
}

interface TimerContextType {
  timerState: TimerStateValue
  isRunning: boolean
  isPaused: boolean
  displayTime: number
  description: string
  projectId: string | null
  project: Pick<Project, 'id' | 'name' | 'color'> | null
  isBillable: boolean
  isSubmitting: boolean
  descriptionInputRef: React.RefObject<HTMLInputElement | null>
  projectSelectRef: React.RefObject<HTMLButtonElement | null>
  startTimer: (options?: {
    description?: string
    projectId?: string | null
    isBillable?: boolean
  }) => Promise<void>
  stopTimer: () => Promise<void>
  pauseTimer: () => Promise<void>
  isAutoPaused: boolean
  resumeTimer: () => Promise<void>
  discardTimer: () => Promise<void>
  setDescription: (description: string) => void
  setProjectId: (projectId: string | null) => void
  setIsBillable: (isBillable: boolean) => void
}

const TimerContext = createContext<TimerContextType | null>(null)

// Initial data passed from server
export interface InitialTimerData {
  timer: ActiveTimer | null
  project: Pick<Project, 'id' | 'name' | 'color'> | null
}

function serverTimerToState(data: InitialTimerData | null): TimerState {
  if (!data?.timer) {
    return {
      isRunning: false,
      isPaused: false,
      isAutoPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      description: '',
      projectId: null,
      project: null,
      isBillable: true,
    }
  }

  return {
    isRunning: true, // Timer exists, so it's in a "started" state
    isPaused: data.timer.is_paused,
    isAutoPaused: false,
    startTime: data.timer.start_time,
    elapsedSeconds: data.timer.elapsed_seconds,
    description: data.timer.description || '',
    projectId: data.timer.project_id,
    project: data.project,
    isBillable: data.timer.is_billable,
  }
}

interface TimerProviderProps {
  children: ReactNode
  initialData?: InitialTimerData | null
}

export function TimerProvider({ children, initialData }: TimerProviderProps) {
  const [timer, setTimer] = useState<TimerState>(() => serverTimerToState(initialData ?? null))
  const [displayTime, setDisplayTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const descriptionDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const descriptionInputRef = useRef<HTMLInputElement | null>(null)
  const projectSelectRef = useRef<HTMLButtonElement | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStartRef = useRef<{ startTime: number; elapsedSeconds: number } | null>(null)
  const { mutate } = useSWRConfig()

  // Start the ticking interval immediately
  const startTicking = useCallback((startTime: number, elapsedSeconds: number) => {
    // Store in ref so interval can access without causing re-renders
    timerStartRef.current = { startTime, elapsedSeconds }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set initial display time
    const initialElapsed = elapsedSeconds + Math.max(0, Math.floor((Date.now() - startTime) / 1000))
    setDisplayTime(initialElapsed)

    // Start ticking every second
    intervalRef.current = setInterval(() => {
      if (timerStartRef.current) {
        const { startTime: start, elapsedSeconds: elapsed } = timerStartRef.current
        const now = Date.now()
        const total = elapsed + Math.max(0, Math.floor((now - start) / 1000))
        setDisplayTime(total)
      }
    }, 1000)
  }, [])

  // Stop the ticking interval
  const stopTicking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    timerStartRef.current = null
  }, [])

  // Fetch timer from server
  const fetchTimer = useCallback(async () => {
    try {
      const response = await timerApi.getTimer()
      if (response.timer) {
        setTimer({
          isRunning: true, // Timer exists, so it's in a "started" state
          isPaused: response.timer.is_paused,
          isAutoPaused: !!response.autoPaused,
          startTime: response.timer.start_time,
          elapsedSeconds: response.timer.elapsed_seconds,
          description: response.timer.description || '',
          projectId: response.timer.project_id,
          project: response.project,
          isBillable: response.timer.is_billable,
        })

        // Show warning if timer was auto-paused
        if (response.autoPaused) {
          const hours = Math.floor(response.timer.elapsed_seconds / 3600)
          toastManager.add({
            type: 'warning',
            title: `Timer auto-paused after ${hours} hours`,
            description: 'Stop the timer and create a new entry to continue tracking.',
          })
        }
      } else {
        // No active timer on server - only reset if we had one locally
        setTimer((prev) => {
          if (prev.isRunning) {
            return {
              isRunning: false,
              isPaused: false,
              isAutoPaused: false,
              startTime: null,
              elapsedSeconds: 0,
              description: '',
              projectId: null,
              project: null,
              isBillable: true,
            }
          }
          return prev
        })
      }
    } catch (error) {
      console.error('Failed to fetch timer:', error)
    }
  }, [])

  // Refetch timer on visibility change (tab becomes visible)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchTimer])

  // Update tab title when timer is running
  useEffect(() => {
    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = seconds % 60
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    if (timer.isRunning && !timer.isPaused) {
      document.title = `${formatTime(displayTime)} - BillMint`
    } else {
      document.title = 'BillMint'
    }
  }, [displayTime, timer.isRunning, timer.isPaused])

  // Handle timer state changes (for initial load and pause/resume from server)
  useEffect(() => {
    if (!timer.isRunning) {
      stopTicking()
      setDisplayTime(0)
      return
    }

    if (timer.isPaused) {
      stopTicking()
      setDisplayTime(Math.max(0, timer.elapsedSeconds))
      return
    }

    // Only start ticking from useEffect if we don't have an active interval
    // (interval is started immediately in startTimer/resumeTimer for instant feedback)
    if (!intervalRef.current && timer.startTime) {
      const startTime = new Date(timer.startTime).getTime()
      startTicking(startTime, timer.elapsedSeconds)
    }
  }, [timer.isRunning, timer.isPaused, timer.startTime, timer.elapsedSeconds, startTicking, stopTicking])

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Optimistic start timer - starts ticking immediately, syncs with server in background
  const startTimer = useCallback(
    async (options?: {
      description?: string
      projectId?: string | null
      isBillable?: boolean
    }) => {
      if (isSubmitting) return
      setIsSubmitting(true)

      const startedAtMs = Date.now()
      const startedAt = new Date(startedAtMs).toISOString()
      const desc = options?.description ?? timer.description
      const projId = options?.projectId !== undefined ? options.projectId : timer.projectId
      const billable = options?.isBillable ?? timer.isBillable

      // Start ticking IMMEDIATELY - don't wait for API
      startTicking(startedAtMs, 0)

      // Update timer state
      setTimer((prev) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        isAutoPaused: false,
        startTime: startedAt,
        elapsedSeconds: 0,
        description: desc,
        projectId: projId,
        isBillable: billable,
      }))

      try {
        const response = await timerApi.startTimer({
          description: desc,
          project_id: projId,
          is_billable: billable,
        })

        // Sync with server response (don't restart interval - just update metadata)
        const serverTimer = response.timer!
        setTimer((prev) => ({
          ...prev,
          description: serverTimer.description || '',
          projectId: serverTimer.project_id,
          project: response.project,
          isBillable: serverTimer.is_billable,
        }))
      } catch (error: unknown) {
        // Stop ticking and revert on error
        stopTicking()

        if (isApiError(error) && error.statusCode === 409) {
          // Timer already running on server - fetch it
          await fetchTimer()
          toastManager.add({ type: 'info', title: 'Timer already running' })
        } else {
          // Revert to idle state
          setTimer({
            isRunning: false,
            isPaused: false,
            isAutoPaused: false,
            startTime: null,
            elapsedSeconds: 0,
            description: desc,
            projectId: projId,
            project: timer.project,
            isBillable: billable,
          })
          setDisplayTime(0)
          toastManager.add({ type: 'error', title: 'Failed to start timer' })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [timer.description, timer.projectId, timer.project, timer.isBillable, isSubmitting, fetchTimer, startTicking, stopTicking]
  )

  // Optimistic stop timer
  const stopTimer = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const prevTimer = { ...timer }
    const savedDuration = displayTime
    const prevTimerStart = timerStartRef.current

    // Stop ticking immediately
    stopTicking()

    // Optimistic update
    setTimer({
      isRunning: false,
      isPaused: false,
      isAutoPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      description: '',
      projectId: null,
      project: null,
      isBillable: true,
    })
    setDisplayTime(0)

    try {
      await timerApi.stopTimer()
      // Invalidate caches so lists refresh
      mutate((key) => {
        if (typeof key === 'string') {
          return key === 'dashboard-stats' || key === ONBOARDING_STATS_KEY
        }
        if (Array.isArray(key)) {
          return key[0] === 'time-entries' || key[0] === 'recent-activity' || key[0] === 'dashboard'
        }
        return false
      })
      toastManager.add({
        type: 'success',
        title: `Entry saved: ${formatDurationHuman(savedDuration)}`,
      })
    } catch {
      // Revert on error - restart ticking
      setTimer(prevTimer)
      if (prevTimerStart && !prevTimer.isPaused) {
        startTicking(prevTimerStart.startTime, prevTimerStart.elapsedSeconds)
      } else {
        setDisplayTime(prevTimer.elapsedSeconds)
      }
      toastManager.add({ type: 'error', title: 'Failed to stop timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [timer, displayTime, isSubmitting, mutate, stopTicking, startTicking])

  // Optimistic pause timer
  const pauseTimer = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const currentDisplayTime = displayTime
    const prevTimerStart = timerStartRef.current

    // Stop ticking immediately
    stopTicking()

    // Optimistic update
    setTimer((prev) => ({
      ...prev,
      isPaused: true,
      elapsedSeconds: currentDisplayTime,
    }))

    try {
      await timerApi.pauseTimer()
    } catch {
      // Revert on error - restart ticking
      setTimer((prev) => ({
        ...prev,
        isPaused: false,
      }))
      if (prevTimerStart) {
        startTicking(prevTimerStart.startTime, prevTimerStart.elapsedSeconds)
      }
      toastManager.add({ type: 'error', title: 'Failed to pause timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [displayTime, isSubmitting, stopTicking, startTicking])

  // Optimistic resume timer - starts ticking immediately
  const resumeTimer = useCallback(async () => {
    if (isSubmitting) return

    // Prevent resuming auto-paused timers - user must stop and create a new entry
    if (timer.isAutoPaused) {
      toastManager.add({
        type: 'warning',
        title: 'Cannot resume auto-paused timer',
        description: 'Stop this timer and start a new one to continue tracking.',
      })
      return
    }

    setIsSubmitting(true)

    const resumedAtMs = Date.now()
    const resumedAt = new Date(resumedAtMs).toISOString()
    const currentElapsed = timer.elapsedSeconds

    // Start ticking IMMEDIATELY with current elapsed time
    startTicking(resumedAtMs, currentElapsed)

    // Optimistic update
    setTimer((prev) => ({
      ...prev,
      isPaused: false,
      startTime: resumedAt,
    }))

    try {
      await timerApi.resumeTimer()
    } catch {
      // Stop ticking and revert on error
      stopTicking()
      setTimer((prev) => ({
        ...prev,
        isPaused: true,
      }))
      setDisplayTime(currentElapsed)
      toastManager.add({ type: 'error', title: 'Failed to resume timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, timer.isAutoPaused, timer.elapsedSeconds, startTicking, stopTicking])

  // Optimistic discard timer
  const discardTimer = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const prevTimer = { ...timer }
    const prevTimerStart = timerStartRef.current

    // Stop ticking immediately
    stopTicking()

    // Optimistic update
    setTimer({
      isRunning: false,
      isPaused: false,
      isAutoPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      description: '',
      projectId: null,
      project: null,
      isBillable: true,
    })
    setDisplayTime(0)

    try {
      await timerApi.discardTimer()
      toastManager.add({ type: 'info', title: 'Timer discarded' })
    } catch {
      // Revert on error - restart ticking if was running
      setTimer(prevTimer)
      if (prevTimerStart && !prevTimer.isPaused) {
        startTicking(prevTimerStart.startTime, prevTimerStart.elapsedSeconds)
      } else {
        setDisplayTime(prevTimer.elapsedSeconds)
      }
      toastManager.add({ type: 'error', title: 'Failed to discard timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [timer, isSubmitting, stopTicking, startTicking])

  // Debounced description update
  const setDescription = useCallback(
    (description: string) => {
      setTimer((prev) => ({ ...prev, description }))

      // Clear existing debounce
      if (descriptionDebounceRef.current) {
        clearTimeout(descriptionDebounceRef.current)
      }

      // Only sync to server if timer is running
      if (timer.isRunning) {
        descriptionDebounceRef.current = setTimeout(() => {
          timerApi.updateTimer({ description }).catch((error) => {
            console.error('Failed to update description:', error)
          })
        }, 500)
      }
    },
    [timer.isRunning]
  )

  // Immediate project update
  const setProjectId = useCallback(
    (projectId: string | null) => {
      // Optimistic update - clear project data, it will be set from API response
      setTimer((prev) => ({ ...prev, projectId, project: projectId ? prev.project : null }))

      // Immediate sync to server if timer is running
      if (timer.isRunning) {
        timerApi.updateTimer({ project_id: projectId })
          .then((response) => {
            // Update project data from server response
            if (response.project) {
              setTimer((prev) => ({ ...prev, project: response.project }))
            }
          })
          .catch((error) => {
            console.error('Failed to update project:', error)
          })
      }
    },
    [timer.isRunning]
  )

  // Immediate billable update
  const setIsBillable = useCallback(
    (isBillable: boolean) => {
      setTimer((prev) => ({ ...prev, isBillable }))

      // Immediate sync to server if timer is running
      if (timer.isRunning) {
        timerApi.updateTimer({ is_billable: isBillable }).catch((error) => {
          console.error('Failed to update billable status:', error)
        })
      }
    },
    [timer.isRunning]
  )

  // Compute timer state
  const timerState: TimerStateValue = timer.isRunning
    ? timer.isPaused
      ? 'paused'
      : 'running'
    : 'idle'

  const value: TimerContextType = {
    timerState,
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    isAutoPaused: timer.isAutoPaused,
    displayTime,
    description: timer.description,
    projectId: timer.projectId,
    project: timer.project,
    isBillable: timer.isBillable,
    isSubmitting,
    descriptionInputRef,
    projectSelectRef,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    discardTimer,
    setDescription,
    setProjectId,
    setIsBillable,
  }

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimerContext() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimerContext must be used within a TimerProvider')
  }
  return context
}
