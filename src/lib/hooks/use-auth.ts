'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { authApi } from '@/lib/api'
import type { SessionResponse, User } from '@/types'

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<SessionResponse>(
    'session',
    () => authApi.getSession(),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  )

  return {
    session: data?.session,
    user: data?.user,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export function useAuth() {
  const router = useRouter()
  const { user, session, isLoading, mutate } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const signup = useCallback(
    async (email: string, password: string, fullName: string) => {
      setIsSubmitting(true)
      setAuthError(null)

      try {
        await authApi.signup(email, password, fullName)
        await mutate()
        router.push('/dashboard')
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : 'Failed to sign up'
        )
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [router, mutate]
  )

  const login = useCallback(
    async (email: string, password: string) => {
      setIsSubmitting(true)
      setAuthError(null)

      try {
        await authApi.login(email, password)
        await mutate()
        router.push('/dashboard')
      } catch (error) {
        setAuthError(
          error instanceof Error ? error.message : 'Failed to log in'
        )
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [router, mutate]
  )

  const logout = useCallback(async () => {
    setIsSubmitting(true)

    try {
      await authApi.logout()
      await mutate()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [router, mutate])

  const resetPassword = useCallback(async (email: string) => {
    setIsSubmitting(true)
    setAuthError(null)

    try {
      await authApi.resetPassword(email)
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Failed to send reset email'
      )
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isPaidUser: user?.tier !== 'free',
    isSubmitting,
    authError,
    signup,
    login,
    logout,
    resetPassword,
    clearError: () => setAuthError(null),
  }
}
