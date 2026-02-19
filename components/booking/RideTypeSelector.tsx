'use client'

import React from 'react'
import { FiClock, FiNavigation } from 'react-icons/fi'

interface BookingTypeSelectorProps {
  value: 'point-to-point' | 'hourly'
  onChange: (type: 'point-to-point' | 'hourly') => void
}

const bookingTypes = [
  {
    id: 'point-to-point',
    name: 'Point to Point',
    description: 'Ride from A to B',
    icon: '📍',
    pricing: 'Per km + time',
  },
  {
    id: 'hourly',
    name: 'Hourly Rental',
    description: 'Book by the hour',
    icon: '⏰',
    pricing: 'Hourly rate',
  },
]

export const RideTypeSelector: React.FC<BookingTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {bookingTypes.map(type => (
        <button
          key={type.id}
          onClick={() => onChange(type.id as any)}
          className={`p-4 rounded-lg border-2 transition text-left ${
            value === type.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <div className="text-3xl mb-2">{type.icon}</div>
          <h3 className="font-bold text-gray-900 mb-1">{type.name}</h3>
          <p className="text-xs text-gray-600 mb-3">{type.description}</p>
          <div className="text-xs text-gray-500">
            {type.pricing}
          </div>
        </button>
      ))}
    </div>
  )
}