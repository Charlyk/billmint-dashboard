'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { timerApi } from '@/lib/api'
import type { TimerResponse, Project } from '@/types'

const TIMER_STORAGE_KEY = 'billmint_timer'
const SYNC_INTERVAL = 30000 // 30 seconds

interface TimerState {
  isRunning: boolean
  isPaused: boolean
  startTime: string | null
  elapsedSeconds: number
  description: string
  projectId: string | null
  isBillable: boolean
}

function getStoredTimer(): TimerState | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(TIMER_STORAGE_KEY)
  return stored ? JSON.parse(stored) : null
}

function storeTimer(timer: TimerState | null) {
  if (typeof window === 'undefined') return
  if (timer) {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timer))
  } else {
    localStorage.removeItem(TIMER_STORAGE_KEY)
  }
}

export function useTimer() {
  const { data: serverTimer, mutate: mutateServerTimer } = useSWR<TimerResponse>(
    'timer',
    () => timerApi.getTimer(),
    { revalidateOnFocus: true }
  )

  const [localTimer, setLocalTimer] = useState<TimerState>(() => {
    const stored = getStoredTimer()
    return (
      stored || {
        isRunning: false,
        isPaused: false,
        startTime: null,
        elapsedSeconds: 0,
        description: '',
        projectId: null,
        isBillable: true,
      }
    )
  })

  const [displayTime, setDisplayTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Calculate display time
  useEffect(() => {
    if (!localTimer.isRunning || localTimer.isPaused) {
      setDisplayTime(localTimer.elapsedSeconds)
      return
    }

    const interval = setInterval(() => {
      const start = new Date(localTimer.startTime!).getTime()
      const now = Date.now()
      const elapsed = localTimer.elapsedSeconds + Math.floor((now - start) / 1000)
      setDisplayTime(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [localTimer.isRunning, localTimer.isPaused, localTimer.startTime, localTimer.elapsedSeconds])

  // Sync with server periodically
  useEffect(() => {
    if (!localTimer.isRunning) return

    const sync = async () => {
      try {
        await timerApi.syncTimer({
          description: localTimer.description,
          project_id: localTimer.projectId,
          is_billable: localTimer.isBillable,
          start_time: localTimer.startTime!,
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
  }, [localTimer, displayTime])

  // Store timer state locally
  useEffect(() => {
    storeTimer(localTimer.isRunning ? localTimer : null)
  }, [localTimer])

  // Restore from server on mount
  useEffect(() => {
    if (serverTimer?.timer && !localTimer.isRunning) {
      const timer = serverTimer.timer
      setLocalTimer({
        isRunning: !timer.is_paused,
        isPaused: timer.is_paused,
        startTime: timer.start_time,
        elapsedSeconds: timer.elapsed_seconds,
        description: timer.description || '',
        projectId: timer.project_id,
        isBillable: timer.is_billable,
      })
    }
  }, [serverTimer])

  const startTimer = useCallback(
    async (options?: {
      description?: string
      projectId?: string | null
      isBillable?: boolean
    }) => {
      setIsSubmitting(true)

      try {
        const response = await timerApi.startTimer({
          description: options?.description,
          project_id: options?.projectId,
          is_billable: options?.isBillable ?? true,
        })

        const timer = response.timer!
        setLocalTimer({
          isRunning: true,
          isPaused: false,
          startTime: timer.start_time,
          elapsedSeconds: 0,
          description: timer.description || '',
          projectId: timer.project_id,
          isBillable: timer.is_billable,
        })

        await mutateServerTimer()
      } finally {
        setIsSubmitting(false)
      }
    },
    [mutateServerTimer]
  )

  const stopTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      const result = await timerApi.stopTimer()

      setLocalTimer({
        isRunning: false,
        isPaused: false,
        startTime: null,
        elapsedSeconds: 0,
        description: '',
        projectId: null,
        isBillable: true,
      })

      storeTimer(null)
      await mutateServerTimer()

      return result.timeEntry
    } finally {
      setIsSubmitting(false)
    }
  }, [mutateServerTimer])

  const pauseTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await timerApi.pauseTimer()

      setLocalTimer((prev) => ({
        ...prev,
        isPaused: true,
        elapsedSeconds: displayTime,
      }))

      await mutateServerTimer()
    } finally {
      setIsSubmitting(false)
    }
  }, [displayTime, mutateServerTimer])

  const resumeTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await timerApi.resumeTimer()

      setLocalTimer((prev) => ({
        ...prev,
        isPaused: false,
        startTime: new Date().toISOString(),
      }))

      await mutateServerTimer()
    } finally {
      setIsSubmitting(false)
    }
  }, [mutateServerTimer])

  const discardTimer = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await timerApi.discardTimer()

      setLocalTimer({
        isRunning: false,
        isPaused: false,
        startTime: null,
        elapsedSeconds: 0,
        description: '',
        projectId: null,
        isBillable: true,
      })

      storeTimer(null)
      await mutateServerTimer()
    } finally {
      setIsSubmitting(false)
    }
  }, [mutateServerTimer])

  const updateTimerDetails = useCallback(
    (updates: {
      description?: string
      projectId?: string | null
      isBillable?: boolean
    }) => {
      setLocalTimer((prev) => ({
        ...prev,
        description: updates.description ?? prev.description,
        projectId: updates.projectId !== undefined ? updates.projectId : prev.projectId,
        isBillable: updates.isBillable ?? prev.isBillable,
      }))

      // Debounced server update
      if (localTimer.isRunning) {
        timerApi.updateTimer({
          description: updates.description,
          project_id: updates.projectId,
          is_billable: updates.isBillable,
        })
      }
    },
    [localTimer.isRunning]
  )

  return {
    isRunning: localTimer.isRunning,
    isPaused: localTimer.isPaused,
    displayTime,
    description: localTimer.description,
    projectId: localTimer.projectId,
    project: serverTimer?.project as Pick<Project, 'id' | 'name' | 'color'> | null,
    isBillable: localTimer.isBillable,
    isSubmitting,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    discardTimer,
    updateTimerDetails,
  }
}
