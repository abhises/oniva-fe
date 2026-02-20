'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiLoader, FiAlertCircle, FiCheck, FiDollarSign } from 'react-icons/fi'

interface PricingConfig {
  commission_percentage: number
  base_fare: number
  per_km_rate: number
  minimum_fare: number
  night_surcharge_percentage: number
  long_distance_coefficient: number
}

interface FormErrors {
  [key: string]: string
}

export default function AdminPricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { request, isLoading: isApiLoading } = useApi({ showSuccess: false })

  const [pricing, setPricing] = useState<PricingConfig | null>(null)
  const [formData, setFormData] = useState<PricingConfig>({
    commission_percentage: 0,
    base_fare: 0,
    per_km_rate: 0,
    minimum_fare: 0,
    night_surcharge_percentage: 0,
    long_distance_coefficient: 0,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load pricing config on mount
  useEffect(() => {
    loadPricingConfig()
  }, [])

 const loadPricingConfig = async () => {
  try {
    setIsLoadingInitial(true)

    const data = await request<PricingConfig>(async () => {
      return await apiClient.getPricing()
    })

    if (data) {
      setPricing(data)
      setFormData(data)
      setHasChanges(false)
    }
  } catch (error) {
    toast.error('Failed to load pricing configuration')
    console.error(error)
  } finally {
    setIsLoadingInitial(false)
  }
}

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (formData.commission_percentage < 0 || formData.commission_percentage > 100) {
      newErrors.commission_percentage = 'Commission must be between 0 and 100%'
    }

    if (formData.base_fare < 0) {
      newErrors.base_fare = 'Base fare cannot be negative'
    }

    if (formData.per_km_rate < 0) {
      newErrors.per_km_rate = 'Per km rate cannot be negative'
    }

    if (formData.minimum_fare < 0) {
      newErrors.minimum_fare = 'Minimum fare cannot be negative'
    }

    if (formData.minimum_fare > formData.base_fare) {
      newErrors.minimum_fare = 'Minimum fare cannot exceed base fare'
    }

    if (formData.night_surcharge_percentage < 0 || formData.night_surcharge_percentage > 100) {
      newErrors.night_surcharge_percentage = 'Night surcharge must be between 0 and 100%'
    }

    if (formData.long_distance_coefficient < 0) {
      newErrors.long_distance_coefficient = 'Long distance coefficient cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof PricingConfig, value: string) => {
    const numValue = parseFloat(value) || 0

    setFormData(prev => ({
      ...prev,
      [field]: numValue,
    }))

    // Check if there are changes
    if (pricing && (numValue !== pricing[field])) {
      setHasChanges(true)
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors below')
      return
    }

    try {
      setIsSaving(true)

      const result = await request(async () => {
        return await apiClient.updatePricing(formData)
      })

      if (result) {
        setPricing(formData)
        setHasChanges(false)
        toast.success('Pricing configuration updated successfully!')
      }
    } catch (error: any) {
      toast.error('Failed to save pricing configuration')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (pricing) {
      setFormData(pricing)
      setHasChanges(false)
      setErrors({})
    }
  }

  if (isLoadingInitial) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading pricing configuration...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiDollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Pricing Configuration</h1>
            </div>
            <p className="text-gray-600">Manage fare structure and surcharges</p>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg">
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Note:</span> Changes to pricing will apply to all new bookings immediately.
              </p>
            </div>

            {/* Form */}
            <div className="p-6 space-y-8">
              {/* Base Pricing Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  Base Pricing
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Commission Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Percentage (%)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        disabled={isApiLoading || isSaving}
                        value={formData.commission_percentage}
                        onChange={(e) => handleInputChange('commission_percentage', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.commission_percentage
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                    </div>
                    {errors.commission_percentage && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.commission_percentage}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Amount taken from each ride</p>
                  </div>

                  {/* Base Fare */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Fare ($)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        disabled={isApiLoading || isSaving}
                        value={formData.base_fare}
                        onChange={(e) => handleInputChange('base_fare', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.base_fare
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">$</span>
                    </div>
                    {errors.base_fare && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.base_fare}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Starting charge for each ride</p>
                  </div>

                  {/* Per KM Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Per KM Rate ($)
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        disabled={isApiLoading || isSaving}
                        value={formData.per_km_rate}
                        onChange={(e) => handleInputChange('per_km_rate', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.per_km_rate
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">$/km</span>
                    </div>
                    {errors.per_km_rate && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.per_km_rate}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Charge per kilometer traveled</p>
                  </div>

                  {/* Minimum Fare */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Fare ($)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        disabled={isApiLoading || isSaving}
                        value={formData.minimum_fare}
                        onChange={(e) => handleInputChange('minimum_fare', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.minimum_fare
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">$</span>
                    </div>
                    {errors.minimum_fare && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.minimum_fare}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Lowest possible fare for a ride</p>
                  </div>
                </div>
              </div>

              {/* Surcharge & Multiplier Section */}
              <div className="border-t pt-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-600 rounded"></div>
                  Surcharges & Multipliers
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Night Surcharge */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Night Surcharge Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        disabled={isApiLoading || isSaving}
                        value={formData.night_surcharge_percentage}
                        onChange={(e) => handleInputChange('night_surcharge_percentage', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.night_surcharge_percentage
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">%</span>
                    </div>
                    {errors.night_surcharge_percentage && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.night_surcharge_percentage}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Extra charge for late night rides (10 PM - 6 AM)</p>
                  </div>

                  {/* Long Distance Coefficient */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Long Distance Coefficient
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        disabled={isApiLoading || isSaving}
                        value={formData.long_distance_coefficient}
                        onChange={(e) => handleInputChange('long_distance_coefficient', e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.long_distance_coefficient
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500">x</span>
                    </div>
                    {errors.long_distance_coefficient && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.long_distance_coefficient}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Multiplier for rides over 25km (e.g., 1.5 = 50% increase)</p>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="border-t pt-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Example Fare Calculation</h2>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Base Fare:</span>
                    <span className="font-semibold text-gray-900">${formData.base_fare.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance (10 km × ${formData.per_km_rate.toFixed(2)}):</span>
                    <span className="font-semibold text-gray-900">${(10 * formData.per_km_rate).toFixed(2)}</span>
                  </div>

                  <div className="border-t pt-3 flex justify-between text-sm">
                    <span className="font-medium text-gray-900">Subtotal:</span>
                    <span className="font-bold text-blue-600">${(formData.base_fare + 10 * formData.per_km_rate).toFixed(2)}</span>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    Actual fare will be calculated based on actual distance and time
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={handleReset}
                disabled={!hasChanges || isSaving || isApiLoading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Reset Changes
              </button>

              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving || isApiLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
              >
                {isSaving || isApiLoading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Current Values Table */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current Configuration</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Field</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Current Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Your Changes</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing && [
                    { key: 'commission_percentage', label: 'Commission Percentage', suffix: '%' },
                    { key: 'base_fare', label: 'Base Fare', suffix: '$' },
                    { key: 'per_km_rate', label: 'Per KM Rate', suffix: '$/km' },
                    { key: 'minimum_fare', label: 'Minimum Fare', suffix: '$' },
                    { key: 'night_surcharge_percentage', label: 'Night Surcharge', suffix: '%' },
                    { key: 'long_distance_coefficient', label: 'Long Distance Coefficient', suffix: 'x' },
                  ].map((field) => {
                    const key = field.key as keyof PricingConfig
                    const currentValue = pricing[key]
                    const newValue = formData[key]
                    const hasChanged = currentValue !== newValue

                    return (
                      <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{field.label}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-600">
                          {currentValue}{field.suffix}
                        </td>
                        <td className={`px-4 py-3 text-sm font-medium ${hasChanged ? 'text-blue-600' : 'text-gray-600'}`}>
                          {newValue}{field.suffix}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {hasChanged ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              Modified
                            </span>
                          ) : (
                            <span className="text-gray-500">No change</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}