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
import { timerApi, isApiError } from '@/lib/api'
import { toastManager } from '@/components/ui/toast'
import { formatDurationHuman } from '@/lib/utils/date'
import type { Project, ActiveTimer } from '@/types'

type TimerStateValue = 'idle' | 'running' | 'paused'

interface TimerState {
  isRunning: boolean
  isPaused: boolean
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

  // Fetch timer from server
  const fetchTimer = useCallback(async () => {
    try {
      const response = await timerApi.getTimer()
      if (response.timer) {
        setTimer({
          isRunning: true, // Timer exists, so it's in a "started" state
          isPaused: response.timer.is_paused,
          startTime: response.timer.start_time,
          elapsedSeconds: response.timer.elapsed_seconds,
          description: response.timer.description || '',
          projectId: response.timer.project_id,
          project: response.project,
          isBillable: response.timer.is_billable,
        })
      } else {
        // No active timer on server - only reset if we had one locally
        setTimer((prev) => {
          if (prev.isRunning) {
            return {
              isRunning: false,
              isPaused: false,
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

  // Calculate display time
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) {
      setDisplayTime(timer.elapsedSeconds)
      return
    }

    // Calculate initial display time immediately
    const start = new Date(timer.startTime!).getTime()
    const now = Date.now()
    setDisplayTime(timer.elapsedSeconds + Math.floor((now - start) / 1000))

    const interval = setInterval(() => {
      const start = new Date(timer.startTime!).getTime()
      const now = Date.now()
      const elapsed = timer.elapsedSeconds + Math.floor((now - start) / 1000)
      setDisplayTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isRunning, timer.isPaused, timer.startTime, timer.elapsedSeconds])

  // Optimistic start timer
  const startTimer = useCallback(
    async (options?: {
      description?: string
      projectId?: string | null
      isBillable?: boolean
    }) => {
      if (isSubmitting) return
      setIsSubmitting(true)

      const startedAt = new Date().toISOString()
      const desc = options?.description ?? timer.description
      const projId = options?.projectId !== undefined ? options.projectId : timer.projectId
      const billable = options?.isBillable ?? timer.isBillable

      // Optimistic update
      setTimer((prev) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
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

        // Sync with server response
        const serverTimer = response.timer!
        setTimer({
          isRunning: true,
          isPaused: false,
          startTime: serverTimer.start_time,
          elapsedSeconds: 0,
          description: serverTimer.description || '',
          projectId: serverTimer.project_id,
          project: response.project,
          isBillable: serverTimer.is_billable,
        })
      } catch (error: unknown) {
        // On conflict (409), fetch the existing timer instead of reverting to idle
        if (isApiError(error) && error.statusCode === 409) {
          // Fetch the existing timer from server
          await fetchTimer()
          toastManager.add({ type: 'info', title: 'Timer already running' })
        } else {
          // Revert on other errors
          setTimer({
            isRunning: false,
            isPaused: false,
            startTime: null,
            elapsedSeconds: 0,
            description: desc,
            projectId: projId,
            project: timer.project,
            isBillable: billable,
          })
          toastManager.add({ type: 'error', title: 'Failed to start timer' })
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [timer.description, timer.projectId, timer.project, timer.isBillable, isSubmitting, fetchTimer]
  )

  // Optimistic stop timer
  const stopTimer = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const prevTimer = { ...timer }
    const savedDuration = displayTime

    // Optimistic update
    setTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      description: '',
      projectId: null,
      project: null,
      isBillable: true,
    })

    try {
      await timerApi.stopTimer()
      toastManager.add({
        type: 'success',
        title: `Entry saved: ${formatDurationHuman(savedDuration)}`,
      })
    } catch {
      // Revert on error
      setTimer(prevTimer)
      toastManager.add({ type: 'error', title: 'Failed to stop timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [timer, displayTime, isSubmitting])

  // Optimistic pause timer
  const pauseTimer = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const currentDisplayTime = displayTime

    // Optimistic update
    setTimer((prev) => ({
      ...prev,
      isPaused: true,
      elapsedSeconds: currentDisplayTime,
    }))

    try {
      await timerApi.pauseTimer()
    } catch {
      // Revert on error
      setTimer((prev) => ({
        ...prev,
        isPaused: false,
      }))
      toastManager.add({ type: 'error', title: 'Failed to pause timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [displayTime, isSubmitting])

  // Optimistic resume timer
  const resumeTimer = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const resumedAt = new Date().toISOString()

    // Optimistic update
    setTimer((prev) => ({
      ...prev,
      isPaused: false,
      startTime: resumedAt,
    }))

    try {
      await timerApi.resumeTimer()
    } catch {
      // Revert on error
      setTimer((prev) => ({
        ...prev,
        isPaused: true,
      }))
      toastManager.add({ type: 'error', title: 'Failed to resume timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting])

  // Optimistic discard timer
  const discardTimer = useCallback(async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const prevTimer = { ...timer }

    // Optimistic update
    setTimer({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      description: '',
      projectId: null,
      project: null,
      isBillable: true,
    })

    try {
      await timerApi.discardTimer()
      toastManager.add({ type: 'info', title: 'Timer discarded' })
    } catch {
      // Revert on error
      setTimer(prevTimer)
      toastManager.add({ type: 'error', title: 'Failed to discard timer' })
    } finally {
      setIsSubmitting(false)
    }
  }, [timer, isSubmitting])

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
