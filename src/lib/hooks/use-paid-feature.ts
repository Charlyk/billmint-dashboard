'use client'

import { useSession } from './use-auth'

export function usePaidFeature() {
  const { user, isLoading } = useSession()

  const isPaidUser = user?.tier !== 'free'
  const tier = user?.tier || 'free'

  const checkAccess = (feature: 'invoices' | 'reports' | 'integrations') => {
    if (isLoading) return { hasAccess: false, isLoading: true }

    switch (feature) {
      case 'invoices':
        // Invoices require pro or business tier
        return { hasAccess: isPaidUser, isLoading: false }
      case 'reports':
        // Reports require pro or business tier
        return { hasAccess: isPaidUser, isLoading: false }
      case 'integrations':
        // Integrations require business tier
        return { hasAccess: tier === 'business', isLoading: false }
      default:
        return { hasAccess: false, isLoading: false }
    }
  }

  return {
    isPaidUser,
    tier,
    isLoading,
    checkAccess,
  }
}
