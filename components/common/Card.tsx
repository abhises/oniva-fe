'use client'

import React from 'react'
import clsx from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-md p-6',
        hoverable && 'hover:shadow-lg cursor-pointer transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}