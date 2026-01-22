'use client'

import { SWRConfig } from 'swr'
import type { ReactNode } from 'react'
import { AuthProvider } from './auth-context'
import { TimerProvider } from './timer-context'
import { ApiClientError } from '@/lib/api/client'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 5000,
        onError: (error) => {
          // Handle 401 errors by redirecting to login
          if (error instanceof ApiClientError && error.statusCode === 401) {
            // Only redirect if we're on a protected route
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
              window.location.href = '/login?redirectTo=' + encodeURIComponent(window.location.pathname)
            }
          }
        },
        shouldRetryOnError: (error) => {
          // Don't retry on authentication errors
          if (error instanceof ApiClientError && error.statusCode === 401) {
            return false
          }
          return true
        },
      }}
    >
      <AuthProvider>
        <TimerProvider>{children}</TimerProvider>
      </AuthProvider>
    </SWRConfig>
  )
}
