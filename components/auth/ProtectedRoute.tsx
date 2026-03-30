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

  const { isAuthenticated, user, isInitialized } = useAuth()
  
  // Memoize roles to avoid useEffect triggers on every parent render
  const rolesString = JSON.stringify(allowedRoles)

  useEffect(() => {
    if (!isInitialized) return // Wait for auth state

    if (!isAuthenticated) {
      router.replace(`/${locale}/login`) // Better to redirect to login
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace(`/${locale}/`)
    }
  }, [isAuthenticated, user, rolesString, router, locale, isInitialized])

  if (!isInitialized) {
    return <Loader fullScreen />
  }

  if (!isAuthenticated) return null

  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null

  return <>{children}</>
}
