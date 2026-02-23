'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import toast from 'react-hot-toast'
import { useTranslation } from "react-i18next";
import { FiArrowLeft, FiLoader, FiCheck, FiDollarSign, FiClock, FiRefreshCw, FiSave } from 'react-icons/fi'

// Backend structure
interface HourlyRates {
  [key: string]: number
}

interface PricingConfig {
  id?: number
  commission_percentage: number
  base_fare: number
  per_km_rate: number
  minimum_fare: number
  night_surcharge_percentage: number
  long_distance_coefficient: number
  hourly_rates: HourlyRates
  is_active?: boolean
  created_at?: string
}

// Form State structure (allows empty strings so the input can be cleared)
interface FormPricingConfig {
  commission_percentage: number | ''
  base_fare: number | ''
  per_km_rate: number | ''
  minimum_fare: number | ''
  night_surcharge_percentage: number | ''
  long_distance_coefficient: number | ''
  hourly_rates: { [key: string]: number | '' }
}

interface FormErrors {
  [key: string]: string
}

export default function AdminPricingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const { request, isLoading: isApiLoading } = useApi({ showSuccess: false })

  const [pricingHistory, setPricingHistory] = useState<PricingConfig[]>([])
  const [pricing, setPricing] = useState<PricingConfig | null>(null)
  
  const [formData, setFormData] = useState<FormPricingConfig>({
    commission_percentage: 25,
    base_fare: 3000,
    per_km_rate: 300,
    minimum_fare: 5000,
    night_surcharge_percentage: 15,
    long_distance_coefficient: 1.1,
    hourly_rates: { "1": 5000, "4": 18000, "8": 35000 }
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isActivating, setIsActivating] = useState<number | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadPricingData()
  }, [])

  const loadPricingData = async () => {
    try {
      setIsLoadingInitial(true)

      // 1. Fetch the raw response
      const rawResponse = await request<any>(async () => {
        return await apiClient.getPricingHistory()
      })

      // 2. Bulletproof Extraction: Check if the array is trapped inside .data
      let extractedData: PricingConfig[] = [];
      
      if (Array.isArray(rawResponse)) {
        extractedData = rawResponse;
      } else if (rawResponse && Array.isArray(rawResponse.data)) {
        extractedData = rawResponse.data;
      }

      // 3. Apply the extracted data
      if (extractedData.length > 0) {
        setPricingHistory(extractedData)
        const activeConfig = extractedData.find(c => c.is_active) || extractedData[0]
        setPricing(activeConfig)
        
        // Ensure hourly rates exist to prevent errors
        const safeActiveConfig = {
          ...activeConfig,
          hourly_rates: activeConfig.hourly_rates || { "1": 0, "4": 0, "8": 0 }
        }
        
        setFormData(safeActiveConfig) // Pre-fill inputs with active config
        setHasChanges(false)
      } else {
        setHasChanges(true) 
      }
    } catch (error) {
      toast.error(t('admin.pricing.errors.loadFailed', 'Failed to load pricing configuration'))
      console.error(error)
    } finally {
      setIsLoadingInitial(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const errPercent = t('admin.pricing.validation.percentage', 'Must be 0-100%')
    const errNegative = t('admin.pricing.validation.negative', 'Cannot be negative')
    
    // Helper to safely check numbers when they might be empty strings
    const getNum = (val: number | '') => val === '' ? 0 : val;

    if (getNum(formData.commission_percentage) < 0 || getNum(formData.commission_percentage) > 100) newErrors.commission_percentage = errPercent
    if (getNum(formData.base_fare) < 0) newErrors.base_fare = errNegative
    if (getNum(formData.per_km_rate) < 0) newErrors.per_km_rate = errNegative
    if (getNum(formData.minimum_fare) < 0) newErrors.minimum_fare = errNegative
    if (getNum(formData.night_surcharge_percentage) < 0 || getNum(formData.night_surcharge_percentage) > 100) newErrors.night_surcharge_percentage = errPercent

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormPricingConfig, value: string) => {
    const val = value === '' ? '' : Number(value);
    setFormData(prev => ({ ...prev, [field]: val }))
    setHasChanges(true)
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleHourlyChange = (hour: string, value: string) => {
    const val = value === '' ? '' : Number(value);
    setFormData(prev => ({
      ...prev,
      hourly_rates: { ...prev.hourly_rates, [hour]: val }
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error(t('admin.pricing.errors.fixBelow', 'Please fix the errors below'))
      return
    }

    // Sanitize payload
    const payloadToSend = {
      ...formData,
      commission_percentage: formData.commission_percentage || 0,
      base_fare: formData.base_fare || 0,
      per_km_rate: formData.per_km_rate || 0,
      minimum_fare: formData.minimum_fare || 0,
      night_surcharge_percentage: formData.night_surcharge_percentage || 0,
      long_distance_coefficient: formData.long_distance_coefficient || 0,
      hourly_rates: {
        "1": formData.hourly_rates["1"] || 0,
        "4": formData.hourly_rates["4"] || 0,
        "8": formData.hourly_rates["8"] || 0,
      }
    };

    try {
      setIsSaving(true)
      const result = await request(async () => {
        return await apiClient.createPricing(payloadToSend)
      })

      if (result) {
        toast.success(t('admin.pricing.success.applied', 'New pricing configuration applied successfully!'))
        loadPricingData() 
      }
    } catch (error: any) {
      toast.error(t('admin.pricing.errors.saveFailed', 'Failed to save pricing configuration'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleActivateHistory = async (id: number) => {
    // if (!window.confirm(t('admin.pricing.confirm.activate', "Activate this past configuration? All future rides will use these prices."))) return;

    try {
      setIsActivating(id)
      const result = await request(async () => {
        return await apiClient.activatePricing(id)
      })

      if (result) {
        toast.success(t('admin.pricing.success.activated', 'Historical pricing activated!'))
        loadPricingData()
      }
    } catch (error: any) {
      toast.error(t('admin.pricing.errors.activateFailed', 'Failed to activate configuration'))
    } finally {
      setIsActivating(null)
    }
  }

  if (isLoadingInitial) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.pricing.loading', 'Loading pricing configuration...')}</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button onClick={() => router.back()} className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
                <FiArrowLeft className="w-4 h-4 mr-2" />
                {t('common.back', 'Back')}
              </button>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{t('admin.pricing.title', 'Pricing Configuration')}</h1>
                  <p className="text-sm text-gray-600">{t('admin.pricing.subtitle', 'Senegal Market Rates (CFA)')}</p>
                </div>
              </div>
            </div>
            <button onClick={loadPricingData} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2 self-start">
              <FiRefreshCw className="w-4 h-4" />
              {t('admin.pricing.refresh', 'Refresh Data')}
            </button>
          </div>

          {/* Configuration Form */}
          <div className="bg-white rounded-lg shadow-lg mb-8 overflow-hidden">
             {/* Base Pricing */}
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded"></div>
                  {t('admin.pricing.sections.tariffs', 'Point-to-Point Tariffs')}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.baseFare', 'Base Fare')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.base_fare} 
                        onChange={(e) => handleInputChange('base_fare', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.base_fare ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">CFA</span>
                    </div>
                    {errors.base_fare && <span className="text-xs text-red-500 mt-1 block">{errors.base_fare}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.perKmRate', 'Per KM Rate')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.per_km_rate} 
                        onChange={(e) => handleInputChange('per_km_rate', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.per_km_rate ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">CFA</span>
                    </div>
                    {errors.per_km_rate && <span className="text-xs text-red-500 mt-1 block">{errors.per_km_rate}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.minimumFare', 'Minimum Fare')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.minimum_fare} 
                        onChange={(e) => handleInputChange('minimum_fare', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.minimum_fare ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">CFA</span>
                    </div>
                    {errors.minimum_fare && <span className="text-xs text-red-500 mt-1 block">{errors.minimum_fare}</span>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.platformFee', 'Platform Fee')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1" 
                        value={formData.commission_percentage} 
                        onChange={(e) => handleInputChange('commission_percentage', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.commission_percentage ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                    </div>
                    {errors.commission_percentage && <span className="text-xs text-red-500 mt-1 block">{errors.commission_percentage}</span>}
                  </div>
                </div>
            </div>

            {/* Hourly Packages */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-purple-600 rounded"></div>
                  {t('admin.pricing.sections.hourly', 'Hourly Packages')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.hourly1', '1 Hour Package')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.hourly_rates["1"]} 
                        onChange={(e) => handleHourlyChange('1', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">CFA</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.hourly4', '4 Hours Package')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.hourly_rates["4"]} 
                        onChange={(e) => handleHourlyChange('4', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">CFA</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.hourly8', '8 Hours Package')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="0" 
                        value={formData.hourly_rates["8"]} 
                        onChange={(e) => handleHourlyChange('8', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">CFA</span>
                    </div>
                  </div>
                </div>
            </div>

            {/* Surcharges */}
            <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-orange-600 rounded"></div>
                  {t('admin.pricing.sections.surcharges', 'Surcharges')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.nightSurcharge', 'Night Surcharge (22:00 - 06:00)')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={formData.night_surcharge_percentage} 
                        onChange={(e) => handleInputChange('night_surcharge_percentage', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${errors.night_surcharge_percentage ? 'border-red-500' : 'border-gray-300'}`} 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                    </div>
                    {errors.night_surcharge_percentage && <span className="text-xs text-red-500 mt-1 block">{errors.night_surcharge_percentage}</span>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('admin.pricing.fields.longDistance', 'Long Distance Multiplier (>50km)')}</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.1" 
                        value={formData.long_distance_coefficient} 
                        onChange={(e) => handleInputChange('long_distance_coefficient', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" 
                        placeholder="0" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-sm">x</span>
                    </div>
                  </div>
                </div>
            </div>

            {/* Save Bar */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {hasChanges 
                  ? t('admin.pricing.status.unsaved', 'Unsaved changes detected') 
                  : t('admin.pricing.status.upToDate', 'Configuration is up to date')}
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                     if(pricing) { setFormData(pricing); setHasChanges(false); setErrors({}); }
                  }}
                  disabled={!hasChanges || isSaving}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium disabled:opacity-50"
                >
                  {t('common.reset', 'Reset')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isSaving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                  {t('admin.pricing.actions.save', 'Save New Configuration')}
                </button>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiClock className="text-gray-500" />
                {t('admin.pricing.history.title', 'History Ledger')}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-6 py-3">{t('admin.pricing.history.columns.date', 'Date')}</th>
                    <th className="px-6 py-3">{t('admin.pricing.history.columns.base', 'Base')}</th>
                    <th className="px-6 py-3">{t('admin.pricing.history.columns.perKm', 'Per KM')}</th>
                    <th className="px-6 py-3">{t('admin.pricing.history.columns.packages', 'Packages (1h/4h/8h)')}</th>
                    <th className="px-6 py-3">{t('admin.pricing.history.columns.status', 'Status')}</th>
                    <th className="px-6 py-3">{t('admin.pricing.history.columns.action', 'Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pricingHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                        <span className="block text-xs text-gray-500">
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{item.base_fare} CFA</td>
                      <td className="px-6 py-4 text-sm">{item.per_km_rate} CFA</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.hourly_rates ? (
                          `${item.hourly_rates["1"] || '-'} / ${item.hourly_rates["4"] || '-'} / ${item.hourly_rates["8"] || '-'}`
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        {item.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('common.active', 'Active')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {t('common.archived', 'Archived')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!item.is_active && item.id && (
                          <button
                            onClick={() => handleActivateHistory(item.id!)}
                            disabled={isActivating === item.id}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1 hover:underline"
                          >
                            {isActivating === item.id ? <FiLoader className="w-3 h-3 animate-spin" /> : <FiRefreshCw className="w-3 h-3" />}
                            {t('common.restore', 'Restore')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {pricingHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                        {t('admin.pricing.history.empty', 'No pricing history found. Save your first configuration above.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}