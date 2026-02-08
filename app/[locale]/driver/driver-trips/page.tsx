'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Loader } from '@/components/common/Loader'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { FiMapPin, FiClock, FiDollarSign, FiCheck } from 'react-icons/fi'

interface DriverTrip {
  id: number
  pickup_address: string
  destination_address: string
  status: string
  total_price: number
  created_at: string
  client_name?: string
}

export default function DriverTripsPage() {
  const { t } = useTranslation()
  const { isLoading, request } = useApi({ showError: true })
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchTrips = async () => {
      const result = await request<DriverTrip[]>(() => apiClient.getTrips())
      if (result) {
        setTrips(result)
      }
    }
    fetchTrips()
  }, [request])

  const filteredTrips = filter === 'all' ? trips : trips.filter((t) => t.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
        return 'info'
      case 'accepted':
        return 'warning'
      default:
        return 'info'
    }
  }

  return (
    <ProtectedRoute allowedRoles={['driver']}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('driver.myTrips')}</h1>

        {/* Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['all', 'completed', 'in_progress', 'accepted'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t(`common.${f}`)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Loader />
        ) : filteredTrips.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">{t('common.noData')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} hoverable>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FiMapPin size={16} />
                      {trip.pickup_address}
                    </h3>
                    <p className="text-sm text-gray-600 ml-6">→ {trip.destination_address}</p>
                  </div>
                  <Badge variant={getStatusColor(trip.status)} label={trip.status} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <FiDollarSign size={16} />
                    <span className="font-semibold text-primary">{trip.total_price} XOF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock size={16} />
                    {new Date(trip.created_at).toLocaleDateString()}
                  </div>
                  {trip.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <FiCheck size={16} />
                      Completed
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}