'use client'

import React from 'react'
import { FiUsers } from 'react-icons/fi'

interface RideTypeSelectorProps {
  value: 'economy' | 'premium' | 'comfort'
  onChange: (type: 'economy' | 'premium' | 'comfort') => void
}

const rideTypes = [
  {
    id: 'economy',
    name: 'Economy',
    description: 'Affordable, comfortable',
    icon: '🚗',
    passengers: 4,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Premium comfort',
    icon: '🚙',
    passengers: 4,
  },
  {
    id: 'comfort',
    name: 'Comfort',
    description: 'Extra space, premium service',
    icon: '🚐',
    passengers: 6,
  },
]

export const RideTypeSelector: React.FC<RideTypeSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {rideTypes.map(type => (
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
          <div className="flex items-center text-xs text-gray-500">
            <FiUsers className="w-3 h-3 mr-1" />
            Up to {type.passengers} passengers
          </div>
        </button>
      ))}
    </div>
  )
}