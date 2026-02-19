'use client'

import React from 'react'
import { FiMinus, FiPlus } from 'react-icons/fi'

interface PassengerSelectorProps {
  value: number
  onChange: (count: number) => void
  maxPassengers?: number
}

export const PassengerSelector: React.FC<PassengerSelectorProps> = ({
  value,
  onChange,
  maxPassengers = 6,
}) => {
  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < maxPassengers) {
      onChange(value + 1)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleDecrement}
        disabled={value <= 1}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
      >
        <FiMinus className="w-5 h-5" />
      </button>

      <div className="flex-1 text-center">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-600">Passenger{value !== 1 ? 's' : ''}</p>
      </div>

      <button
        onClick={handleIncrement}
        disabled={value >= maxPassengers}
        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
      >
        <FiPlus className="w-5 h-5" />
      </button>
    </div>
  )
}