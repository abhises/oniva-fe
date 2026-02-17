'use client'

import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FiSave, FiTruck } from 'react-icons/fi'

interface VehicleInformationProps {
  initialData?: any
  onSuccess: () => void
}

export const VehicleInformation: React.FC<VehicleInformationProps> = ({
  initialData,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    vehicleType: initialData?.vehicleType || 'sedan',
    make: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    licensePlate: initialData?.licensePlate || '',
    color: initialData?.color || '',
    seats: initialData?.seats || 4,
    mileage: initialData?.mileage || 0,
    registrationExpiry: initialData?.registrationExpiry || '',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.make.trim()) newErrors.make = 'Required'
    if (!formData.model.trim()) newErrors.model = 'Required'
    if (!formData.licensePlate.trim()) newErrors.licensePlate = 'Required'
    if (!formData.color.trim()) newErrors.color = 'Required'
    if (!formData.registrationExpiry) newErrors.registrationExpiry = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['year', 'seats', 'mileage'].includes(name) ? parseInt(value) : value,
    }))
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
      const response = await fetch('/api/driver/vehicle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed')
      toast.success('Vehicle info saved')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center mb-6">
          <FiTruck className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Vehicle Information</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="text-red-500">*</span>
          </label>
          <select
            name="vehicleType"
            value={formData.vehicleType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="truck">Truck</option>
            <option value="van">Van</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Make</label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              placeholder="Toyota"
              className={`w-full px-4 py-2 border rounded-lg ${errors.make ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.make && <p className="text-red-500 text-sm mt-1">{errors.make}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Camry"
              className={`w-full px-4 py-2 border rounded-lg ${errors.model ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            min="1990"
            className="px-4 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="text"
            name="color"
            value={formData.color}
            onChange={handleChange}
            placeholder="White"
            className={`px-4 py-2 border rounded-lg ${errors.color ? 'border-red-500' : 'border-gray-300'}`}
          />
        </div>

        <input
          type="text"
          name="licensePlate"
          value={formData.licensePlate}
          onChange={handleChange}
          placeholder="ABC-1234"
          className={`w-full px-4 py-2 border rounded-lg uppercase ${errors.licensePlate ? 'border-red-500' : 'border-gray-300'}`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="number"
            name="seats"
            value={formData.seats}
            onChange={handleChange}
            min="1"
            max="8"
            className="px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Seats"
          />
          <input
            type="number"
            name="mileage"
            value={formData.mileage}
            onChange={handleChange}
            min="0"
            className="px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Mileage"
          />
        </div>

        <input
          type="date"
          name="registrationExpiry"
          value={formData.registrationExpiry}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-lg ${errors.registrationExpiry ? 'border-red-500' : 'border-gray-300'}`}
        />

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