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
import { timerApi } from '@/lib/api'
import { useAuthContext } from './auth-context'
import type { Project } from '@/types'

const TIMER_STORAGE_KEY = 'billmint_timer'
const SYNC_INTERVAL = 30000

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
  isRunning: boolean
  isPaused: boolean
  displayTime: number
  description: string
  projectId: string | null
  project: Pick<Project, 'id' | 'name' | 'color'> | null
  isBillable: boolean
  isSubmitting: boolean
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

function getStoredTimer(): TimerState | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(TIMER_STORAGE_KEY)
  return stored ? JSON.parse(stored) : null
}

function storeTimer(timer: Partial<TimerState> | null) {
  if (typeof window === 'undefined') return
  if (timer && timer.isRunning) {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer))
  } else {
    localStorage.removeItem(TIMER_STORAGE_KEY)
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuthContext()

  const [timer, setTimer] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    startTime: null,
    elapsedSeconds: 0,
    description: '',
    projectId: null,
    project: null,
    isBillable: true,
  })

  const [displayTime, setDisplayTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const isInitialized = useRef(false)

  // Initialize from localStorage and server
  useEffect(() => {
    // Don't initialize until we know auth state
    if (authLoading) return
    if (isInitialized.current) return
    isInitialized.current = true

    const stored = getStoredTimer()
    if (stored) {
      setTimer(stored)
    }

    // Only fetch from server if authenticated
    if (!isAuthenticated) return

    timerApi
      .getTimer()
      .then((response) => {
        if (response.timer) {
          setTimer({
            isRunning: !response.timer.is_paused,
            isPaused: response.timer.is_paused,
            startTime: response.timer.start_time,
            elapsedSeconds: response.timer.elapsed_seconds,
            description: response.timer.description || '',
            projectId: response.timer.project_id,
            project: response.project,
            isBillable: response.timer.is_billable,
          })
        }
      })
      .catch((error) => {
        console.error('Failed to fetch timer:', error)
      })
  }, [authLoading, isAuthenticated])

  // Calculate display time
  useEffect(() => {
    if (!timer.isRunning || timer.isPaused) {
      setDisplayTime(timer.elapsedSeconds)
      return
    }

    const interval = setInterval(() => {
      const start = new Date(timer.startTime!).getTime()
      const now = Date.now()
      const elapsed = timer.elapsedSeconds + Math.floor((now - start) / 1000)
      setDisplayTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.isRunning, timer.isPaused, timer.startTime, timer.elapsedSeconds])

  // Sync with server periodically
  useEffect(() => {
    if (!timer.isRunning || !isAuthenticated) return

    const sync = async () => {
      try {
        await timerApi.syncTimer({
          description: timer.description,
          project_id: timer.projectId,
          is_billable: timer.isBillable,
          start_time: timer.startTime!,
          elapsed_seconds: displayTime,
        })
      } catch (error) {
        console.error('Failed to sync timer:', error)
      }
    }

    syncTimeoutRef.current = setTimeout(sync, SYNC_INTERVAL)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [timer, displayTime, isAuthenticated])

  // Store timer state
  useEffect(() => {
    storeTimer(timer)
  }, [timer])

  const startTimer = useCallback(
    async (options?: {
      description?: string
      projectId?: string | null
      isBillable?: boolean
    }) => {
      setIsSubmitting(true)

      try {
        const response = await timerApi.startTimer({
          description: options?.description || timer.description,
          project_id: options?.projectId !== undefined ? options.projectId : timer.projectId,
          is_billable: options?.isBillable ?? timer.isBillable,
        })

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
      } finally {
        setIsSubmitting(false)
      }
    },
    [timer.description, timer.projectId, timer.isBillable]
  )

  const stopTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await timerApi.stopTimer()

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
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const pauseTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await timerApi.pauseTimer()

      setTimer((prev) => ({
        ...prev,
        isPaused: true,
        elapsedSeconds: displayTime,
      }))
    } finally {
      setIsSubmitting(false)
    }
  }, [displayTime])

  const resumeTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await timerApi.resumeTimer()

      setTimer((prev) => ({
        ...prev,
        isPaused: false,
        startTime: new Date().toISOString(),
      }))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const discardTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await timerApi.discardTimer()

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
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const setDescription = useCallback((description: string) => {
    setTimer((prev) => ({ ...prev, description }))
  }, [])

  const setProjectId = useCallback((projectId: string | null) => {
    setTimer((prev) => ({ ...prev, projectId }))
  }, [])

  const setIsBillable = useCallback((isBillable: boolean) => {
    setTimer((prev) => ({ ...prev, isBillable }))
  }, [])

  const value: TimerContextType = {
    isRunning: timer.isRunning,
    isPaused: timer.isPaused,
    displayTime,
    description: timer.description,
    projectId: timer.projectId,
    project: timer.project,
    isBillable: timer.isBillable,
    isSubmitting,
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
