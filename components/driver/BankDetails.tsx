'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FiSave, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'

interface BankDetailsProps {
  initialData?: any
  onSuccess: () => void
}

export const BankDetails: React.FC<BankDetailsProps> = ({
  initialData,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showAccountNumber, setShowAccountNumber] = useState(false)
  const [formData, setFormData] = useState({
    accountHolderName: initialData?.accountHolderName || '',
    bankName: initialData?.bankName || '',
    accountNumber: initialData?.accountNumber || '',
    routingNumber: initialData?.routingNumber || '',
    accountType: initialData?.accountType || 'checking',
    swiftCode: initialData?.swiftCode || '',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.accountHolderName.trim()) newErrors.accountHolderName = 'Required'
    if (!formData.bankName.trim()) newErrors.bankName = 'Required'
    if (!formData.accountNumber.trim()) newErrors.accountNumber = 'Required'
    if (formData.accountNumber.length < 8) newErrors.accountNumber = 'Min 8 digits'
    if (!formData.routingNumber.trim()) newErrors.routingNumber = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix errors')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/driver/bank-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed')
      toast.success('Bank details saved')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
        <FiLock className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-700">
          Your bank details are encrypted and secure. Used only for payment processing.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="accountHolderName"
            value={formData.accountHolderName}
            onChange={handleChange}
            placeholder="John Doe"
            className={`w-full px-4 py-2 border rounded-lg ${errors.accountHolderName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.accountHolderName && <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            placeholder="Chase Bank"
            className={`w-full px-4 py-2 border rounded-lg ${errors.bankName ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Type <span className="text-red-500">*</span>
          </label>
          <select
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showAccountNumber ? 'text' : 'password'}
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg pr-10 ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowAccountNumber(!showAccountNumber)}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showAccountNumber ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Routing Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="routingNumber"
            value={formData.routingNumber}
            onChange={handleChange}
            placeholder="021000021"
            className={`w-full px-4 py-2 border rounded-lg ${errors.routingNumber ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.routingNumber && <p className="text-red-500 text-sm mt-1">{errors.routingNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SWIFT Code (Optional)
          </label>
          <input
            type="text"
            name="swiftCode"
            value={formData.swiftCode}
            onChange={handleChange}
            placeholder="CHASUS33"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase"
          />
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center"
          >
            <FiSave className="mr-2" />
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}