'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Loader } from '@/components/common/Loader'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const { isAuthenticated, user, loading, isInitialized } = useAuth()

  useEffect(() => {
    if (loading || !isInitialized) return // Wait for auth state

    if (!isAuthenticated) {
      router.replace(`/${locale}`)
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(`/${locale}/`)  // only if user role is not allowed
    }
  }, [loading, isAuthenticated, user, allowedRoles, router, locale, isInitialized])

  if (loading || !isInitialized) {
    return <Loader fullScreen />
  }

  if (!isAuthenticated) return null

  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
