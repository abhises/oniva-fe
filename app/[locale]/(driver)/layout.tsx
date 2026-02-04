'use client'

import { ReactNode } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function DriverLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['driver']}>
      {children}
    </ProtectedRoute>
  )
}