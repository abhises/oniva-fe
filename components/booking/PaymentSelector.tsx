'use client'

import React from 'react'
import { FiCreditCard, FiDollarSign, FiSmartphone } from 'react-icons/fi'
import { useTranslation } from '@/hooks/useTranslation'

interface PaymentSelectorProps {
  value: 'card' | 'cash' | 'wallet'
  onChange: (method: 'card' | 'cash' | 'wallet') => void
}

const paymentMethods = [
  { id: 'cash', name: 'Cash', icon: FiDollarSign, disabled: false },
  { id: 'card', name: 'Card', icon: FiCreditCard, disabled: true },
  { id: 'wallet', name: 'Wallet', icon: FiSmartphone, disabled: true },
]

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {paymentMethods.map(method => {
        const Icon = method.icon
        return (
          <button
            type="button"
            key={method.id}
            disabled={method.disabled}
            onClick={() => !method.disabled && onChange(method.id as any)}
            className={`p-5 rounded-[24px] border-2 transition-all flex flex-col items-center relative overflow-hidden ${
              method.disabled
                ? 'border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed grayscale'
                : value === method.id
                ? 'border-primary bg-primary/5 shadow-sm scale-[1.02]'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <Icon className={`w-6 h-6 mb-3 ${method.disabled ? 'text-gray-400' : value === method.id ? 'text-primary' : 'text-gray-700'}`} />
            <span className={`text-[11px] font-black uppercase tracking-widest ${method.disabled ? 'text-gray-400' : value === method.id ? 'text-primary' : 'text-gray-800'}`}>
              {method.id === 'cash' ? t('common.cash') : method.name}
            </span>
            {method.disabled && (
              <span className="absolute top-2 right-2 text-[8px] font-bold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-[6px] uppercase tracking-wider">
                {t('common.comingSoon') || 'Soon'}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}