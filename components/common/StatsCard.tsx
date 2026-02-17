'use client'

import React from 'react'

interface StatsCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down'
  trendValue?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon,
  trend,
  trendValue,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-md cursor-pointer hover:scale-105 ">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trendValue && (
            <p
              className={`text-sm mt-2 ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {icon && <div className="text-gray-400 text-2xl">{icon}</div>}
      </div>
    </div>
  )
}