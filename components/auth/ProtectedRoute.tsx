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
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/${locale}/login`)
    } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.push(`/${locale}/`)
    }
  }, [isAuthenticated, user, allowedRoles, router, locale])

  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return <Loader fullScreen />
  }

  return <>{children}</>
}