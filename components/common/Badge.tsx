'use client'

import React from 'react'
import clsx from 'clsx'

interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'info'
  label: string
}

export const Badge: React.FC<BadgeProps> = ({ variant, label }) => {
  const styles = {
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span
      className={clsx(
        'px-3 py-1 rounded-full text-sm font-semibold',
        styles[variant]
      )}
    >
      {label}
    </span>
  )
}