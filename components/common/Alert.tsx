'use client'

import React from 'react'
import clsx from 'clsx'
import { FiAlertCircle, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi'

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const styles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  }

  const icons = {
    success: <FiCheckCircle />,
    error: <FiXCircle />,
    warning: <FiAlertCircle />,
    info: <FiInfo />,
  }

  return (
    <div
      className={clsx(
        'border-l-4 rounded p-4 flex items-start gap-3',
        styles[type]
      )}
    >
      <span className="text-lg">{icons[type]}</span>
      <div className="flex-1">
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-lg hover:opacity-70 transition"
        >
          ×
        </button>
      )}
    </div>
  )
}