'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouter, useParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Loader } from '@/components/common/Loader'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { FiMapPin, FiClock, FiDollarSign, FiCheck, FiChevronRight } from 'react-icons/fi'
import { Button } from '@/components/common/Button'

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
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || 'en'
  
  const { isLoading, request } = useApi({ showError: true })
  const [trips, setTrips] = useState<DriverTrip[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchTrips = async () => {
      const result = await request<DriverTrip[]>(() => apiClient.getDriverTrips())
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
      case 'cancelled':
        return 'danger'
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
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {t(`common.${f}`)}
            </Button>
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
              <div 
                key={trip.id} 
                onClick={() => router.push(`/${locale}/driver/driver-trips/${trip.id}`)}
                className="cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <Card hoverable>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-start gap-2 mb-2">
                        <FiMapPin size={18} className="text-primary mt-1 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("driver.pickupAddress")}</p>
                          <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">
                            {trip.pickup_address}
                          </h3>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 ml-0.5 sm:ml-0">
                        <div className="w-[18px] flex justify-center shrink-0">
                          <div className="w-0.5 h-4 bg-gray-200 border-dashed border-l"></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-[18px] flex justify-center shrink-0">
                           <div className="w-2 h-2 rounded-full bg-gray-300 mt-1.5"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("driver.destinationAddress")}</p>
                          <p className="text-sm text-gray-600 leading-tight">
                            {trip.destination_address || t("driver.openDestination")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-50">
                      <Badge variant={getStatusColor(trip.status)} label={trip.status} />
                      <FiChevronRight className="text-gray-400 hidden sm:block" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-600 border-t pt-4">
                    <div className="flex items-center gap-2 bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <FiDollarSign size={16} className="text-green-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase sm:hidden font-bold">{t("driver.totalFare")}</p>
                        <span className="font-bold text-gray-900">{trip.total_price.toLocaleString()} XOF</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <FiClock size={16} className="shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase sm:hidden font-bold">{t("driver.date")}</p>
                        <span className="text-gray-700">{new Date(trip.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}