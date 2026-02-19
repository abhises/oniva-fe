'use client'

import React from 'react'
import { FiCreditCard, FiDollarSign,  } from 'react-icons/fi'

interface PaymentSelectorProps {
  value: 'card' | 'cash' | 'wallet'
  onChange: (method: 'card' | 'cash' | 'wallet') => void
}

const paymentMethods = [
  { id: 'card', name: 'Credit/Debit Card', icon: FiCreditCard },
  { id: 'cash', name: 'Cash', icon: FiDollarSign },
//   { id: 'wallet', name: 'Wallet', icon: FiWallet },
]

export const PaymentSelector: React.FC<PaymentSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {paymentMethods.map(method => {
        const Icon = method.icon
        return (
          <button
            key={method.id}
            onClick={() => onChange(method.id as any)}
            className={`p-4 rounded-lg border-2 transition flex flex-col items-center ${
              value === method.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            <Icon className="w-6 h-6 mb-2 text-gray-700" />
            <span className="text-xs font-medium text-gray-900 text-center">
              {method.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}