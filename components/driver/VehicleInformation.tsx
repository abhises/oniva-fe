'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FiSave, FiTruck, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import { apiClient } from '@/services/api'

/* =========================
   Types
========================= */

interface VehicleInformationProps {
  initialData?: any
  // Updated to pass the data back to the parent
  onSuccess: (data: any) => void 
  onBack?: () => void
  isInitialSetup?: boolean
  isLoading?: boolean // Passed from parent API state
}

/* =========================
   Component
========================= */

export const VehicleInformation: React.FC<VehicleInformationProps> = ({
  initialData,
  onSuccess,
  onBack,
  isInitialSetup = false,
  isLoading: isSubmitting = false
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    make: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    licensePlate: initialData?.licensePlate || '',
    color: initialData?.color || '',
    vehicleType: initialData?.vehicleType || 'sedan',
    seats: initialData?.seats || 4,
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.make.trim()) newErrors.make = 'Make is required'
    if (!formData.model.trim()) newErrors.model = 'Model is required'
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'License plate is required'
    if (!formData.color.trim()) newErrors.color = 'Color is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'seats' ? parseInt(value) || value : value,
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please complete all required fields')
      return
    }

    // If it's the initial setup flow, pass data to Parent (DriverSetupPage) 
    // to call the final createProfile API
    if (isInitialSetup) {
      onSuccess(formData)
      return
    }

    // If it's an edit from the profile page, call the standalone update API
    try {
      const response = await apiClient.updateDriverProfile({ vehicleInfo: formData })

      toast.success('Vehicle information updated')
      onSuccess(formData)
    } catch (error: any) {
      toast.error(error.message || 'Update failed')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center space-x-2 text-blue-600 mb-2">
        <FiTruck className="w-5 h-5" />
        <span className="font-bold uppercase tracking-wider text-sm">Vehicle Details</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
          <input
            type="text"
            name="make"
            value={formData.make}
            onChange={handleChange}
            placeholder="e.g. Toyota"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.make ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <input
            type="text"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g. Prius"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.model ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            min="2000"
            max={new Date().getFullYear() + 1}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="e.g. White"
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.color ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>

        {/* License Plate */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">License Plate Number</label>
          <input
            type="text"
            name="licensePlate"
            value={formData.licensePlate}
            onChange={handleChange}
            placeholder="SN-123-XYZ"
            className={`w-full px-4 py-2 border rounded-lg uppercase focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.licensePlate ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-100">
        {isInitialSetup && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-gray-500 hover:text-gray-800 font-semibold transition"
          >
            <FiArrowLeft className="mr-2" /> Previous Step
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`ml-auto px-10 py-3 rounded-xl font-bold flex items-center transition shadow-lg ${
            isSubmitting 
            ? 'bg-gray-400 cursor-not-allowed text-white' 
            : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100'
          }`}
        >
          {isSubmitting ? (
            'Processing...'
          ) : isInitialSetup ? (
            <>Complete Registration <FiCheckCircle className="ml-2" /></>
          ) : (
            <>Save Changes <FiSave className="ml-2" /></>
          )}
        </button>
      </div>
    </form>
  )
}