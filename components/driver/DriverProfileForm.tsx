'use client'

import React, { useState } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import toast from 'react-hot-toast'
import { FiSave, FiMail, FiPhone, FiUser, FiArrowRight, FiFileText, FiMapPin } from 'react-icons/fi'

/* =========================
   Types
========================= */

interface DriverProfileFormProps {
  initialData?: any
  // CHANGE: onSuccess now passes the data back to the parent
  onSuccess: (data: any) => void
  isInitialSetup?: boolean
}

export const DriverProfileForm: React.FC<DriverProfileFormProps> = ({
  initialData,
  onSuccess,
  isInitialSetup = false,
}) => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ALIGNED: Using keys that match your backend schema
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    nationalId: initialData?.nationalId || '',
    drivingLicense: initialData?.drivingLicense || '',
    licenseExpiry: initialData?.licenseExpiry || '',
    region: initialData?.region || 'Dakar',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.nationalId.trim()) newErrors.nationalId = 'National ID is required'
    if (!formData.drivingLicense.trim()) newErrors.drivingLicense = 'License number is required'
    if (!formData.licenseExpiry) newErrors.licenseExpiry = 'Expiry date is required'
    if (!formData.region.trim()) newErrors.region = 'Region is required'

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

    // IF INITIAL SETUP: Just pass data up to DriverSetupPage
    if (isInitialSetup) {
      onSuccess(formData)
      return
    }

    // IF EDIT MODE: Perform the legacy PUT request
    try {
      setIsLoading(true)
      const response = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update')
      toast.success('Profile updated')
      onSuccess(formData)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FiUser className="inline mr-2" /> Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FiPhone className="inline mr-2" /> Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* National ID */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FiFileText className="inline mr-2" /> National ID (CNI)
          </label>
          <input
            type="text"
            name="nationalId"
            value={formData.nationalId}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.nationalId ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Driving License */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Driving License Number
          </label>
          <input
            type="text"
            name="drivingLicense"
            value={formData.drivingLicense}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.drivingLicense ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        {/* License Expiry */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            License Expiry Date
          </label>
          <input
            type="date"
            name="licenseExpiry"
            value={formData.licenseExpiry}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.licenseExpiry ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <FiMapPin className="inline mr-2" /> Region
          </label>
          <select
            name="region"
            value={formData.region}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Dakar">Dakar</option>
            <option value="Thies">Thiès</option>
            <option value="Saint-Louis">Saint-Louis</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {isInitialSetup ? (
            <> Continue <FiArrowRight className="ml-2" /> </>
          ) : (
            <> <FiSave className="mr-2" /> {isLoading ? 'Saving...' : 'Save Changes'} </>
          )}
        </button>
      </div>
    </form>
  )
}