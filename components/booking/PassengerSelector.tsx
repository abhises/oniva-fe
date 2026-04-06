'use client'

import React from 'react'
import { FiMinus, FiPlus } from 'react-icons/fi'

interface PassengerSelectorProps {
  value: number
  onChange: (count: number) => void
  maxPassengers?: number
  size?: 'sm' | 'md' | 'lg' | string
}

export const PassengerSelector: React.FC<PassengerSelectorProps> = ({
  value,
  onChange,
  maxPassengers = 6,
  size = 'md',
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
    <div className="flex items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-[32px] border border-gray-100">
      <button
        onClick={handleDecrement}
        disabled={value <= 1}
        className="w-14 h-14 flex items-center justify-center bg-white border border-gray-100 rounded-[24px] hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(0,0,0,0.02)] active:scale-95"
      >
        <FiMinus className="w-5 h-5 text-gray-700" />
      </button>

      <div className="flex-1 text-center">
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mt-1">Passenger{value !== 1 ? 's' : ''}</p>
      </div>

      <button
        onClick={handleIncrement}
        disabled={value >= maxPassengers}
        className="w-14 h-14 flex items-center justify-center bg-white border border-gray-100 rounded-[24px] hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(0,0,0,0.02)] active:scale-95"
      >
        <FiPlus className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  )
}