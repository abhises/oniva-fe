'use client'

import { ReactNode } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      {children}
    </ProtectedRoute>
  )
}