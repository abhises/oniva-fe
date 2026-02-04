'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Card } from '@/components/common/Card'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi'

export default function BookTripPage({ params }: { params: { locale: string } }) {
  const { t } = useTranslation()
  const { isLoading, request } = useApi({ showSuccess: true })

  const [formData, setFormData] = useState({
    bookingType: 'point-to-point',
    pickupLat: '',
    pickupLng: '',
    pickupAddress: '',
    destinationLat: '',
    destinationLng: '',
    destinationAddress: '',
    distance: '',
    duration: '',
    basePrice: '',
    paymentMethod: 'cash',
    region: 'Dakar',
  })

  const [estimatedFare, setEstimatedFare] = useState<any>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEstimate = async () => {
    const result = await request(() =>
      apiClient.estimateFare(formData.bookingType, parseFloat(formData.distance), new Date().toISOString())
    )
    setEstimatedFare(result)
  }

  const handleBook = async () => {
    await request(() =>
      apiClient.bookTrip({
        ...formData,
        pickupLat: parseFloat(formData.pickupLat),
        pickupLng: parseFloat(formData.pickupLng),
        destinationLat: parseFloat(formData.destinationLat),
        destinationLng: parseFloat(formData.destinationLng),
        distance: parseFloat(formData.distance),
        basePrice: parseFloat(formData.basePrice),
      })
    )
  }

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('client.bookTrip')}</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <h2 className="text-xl font-bold mb-4">{t('client.tripDetails')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('client.tripType')}</label>
                <select
                  name="bookingType"
                  value={formData.bookingType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="point-to-point">{t('client.pointToPoint')}</option>
                  <option value="hourly">{t('client.hourly')}</option>
                </select>
              </div>

              <Input
                label={t('client.pickupLocation')}
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                placeholder="Downtown"
              />

              <Input
                label={t('client.destination')}
                name="destinationAddress"
                value={formData.destinationAddress}
                onChange={handleChange}
                placeholder="Airport"
              />

              <Input
                label={t('client.distance')} 
                name="distance"
                type="number"
                value={formData.distance}
                onChange={handleChange}
                placeholder="5.2 km"
              />

              <div className="flex gap-4">
                <Button variant="secondary" onClick={handleEstimate} disabled={isLoading}>
                  {t('client.estimateFare')}
                </Button>
              </div>
            </div>
          </Card>

          {/* Fare Summary */}
          {estimatedFare && (
            <Card className="bg-gray-50">
              <h2 className="text-xl font-bold mb-4">{t('client.estimatedFare')}</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{t('client.basePrice')}</span>
                  <span className="font-bold">{estimatedFare.basePrice} XOF</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('client.platformCommission')}</span>
                  <span className="font-bold">{estimatedFare.platformCommission} XOF</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span>{t('client.totalPrice')}</span>
                  <span className="font-bold text-primary">{estimatedFare.totalPrice} XOF</span>
                </div>
                <Button variant="primary" fullWidth onClick={handleBook} isLoading={isLoading}>
                  {t('client.confirmBooking')}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}