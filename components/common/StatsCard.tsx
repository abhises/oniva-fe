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
    <div className="card-modern shadow-premium-hover group cursor-pointer transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="space-y-3">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest leading-none">{label}</p>
          <h4 className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h4>
          {trendValue && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              trend === 'up' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-rose-100/50 text-rose-700'
            }`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
            <div className="text-2xl">{icon}</div>
          </div>
        )}
      </div>
    </div>
  )
}