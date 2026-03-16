'use client'

import React from 'react'
import { FiLoader } from 'react-icons/fi'

interface LoaderProps {
  fullScreen?: boolean
  message?: string
}

export const Loader: React.FC<LoaderProps> = ({
  fullScreen = false,
  message = 'Loading...',
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* Replaced the CSS circle with the FiLoader icon */}
      <FiLoader className="w-12 h-12 text-primary animate-spin" />
      {message && <p className="text-gray-600 font-medium">{message}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    )
  }

  return content
}