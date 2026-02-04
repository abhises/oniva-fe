'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { StatsCard } from '@/components/common/StatsCard'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import Link from 'next/link'
import { FiMapPin, FiDollarSign, FiStar, FiTrendingUp } from 'react-icons/fi'

export default function DriverDashboard({ params }: { params: { locale: string } }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { isLoading, request } = useApi({ showSuccess: true })

  const [isOnline, setIsOnline] = useState(false)
  const [stats, setStats] = useState({
    totalTrips: 0,
    earnings: 0,
    rating: 5.0,
  })
  const [pendingRequests, setPendingRequests] = useState<any[]>([])

  useEffect(() => {
    const updateStatus = async () => {
      await request(() => apiClient.setOnlineStatus(isOnline))
    }
    updateStatus()
  }, [isOnline, request])

  useEffect(() => {
    const fetchRequests = async () => {
      if (isOnline) {
        const result = await request<[]>(() => apiClient.getPendingRequests())
        if (result) {
          setPendingRequests(result)
        }
      }
    }

    const interval = isOnline ? setInterval(fetchRequests, 5000) : undefined
    fetchRequests()

    return () => clearInterval(interval)
  }, [isOnline, request])

  const handleAccept = async (requestId: string) => {
    await request(() => apiClient.acceptRequest(requestId))
  }

  const handleReject = async (requestId: string) => {
    await request(() => apiClient.rejectRequest(requestId, 'Too far away'))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t('driver.dashboard')}</h1>
        <Button
          variant={isOnline ? 'danger' : 'success'}
          onClick={() => setIsOnline(!isOnline)}
          isLoading={isLoading}
        >
          {isOnline ? t('driver.goOffline') : t('driver.goOnline')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          label={t('driver.totalTrips')}
          value={stats.totalTrips}
          icon={<FiMapPin />}
          trend="up"
          trendValue="5 this week"
        />
        <StatsCard
          label={t('driver.totalEarnings')}
          value={`${stats.earnings.toLocaleString()} XOF`}
          icon={<FiDollarSign />}
          trend="up"
          trendValue="15% from last week"
        />
        <StatsCard
          label={t('driver.rating')}
          value={stats.rating.toFixed(1)}
          icon={<FiStar />}
          trend="up"
          trendValue="Based on 45 ratings"
        />
      </div>

      {/* Pending Requests */}
      {isOnline && (
        <Card>
          <h2 className="text-2xl font-bold mb-4">{t('driver.pendingRequests')}</h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-600 text-center py-8">{t('common.loading')}</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FiMapPin size={16} className="text-primary" />
                        {request.pickup_address}
                      </h3>
                      <p className="text-sm text-gray-600 ml-6">→ {request.destination_address}</p>
                    </div>
                    <Badge variant="warning" label={`${request.distance} km`} />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">{t('client.estimatedFare')}</p>
                      <p className="font-bold text-primary">{request.total_price} XOF</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                        isLoading={isLoading}
                      >
                        {t('driver.accept')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                        isLoading={isLoading}
                      >
                        {t('driver.reject')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link href={`/${params.locale}/driver/trips`}>
          <Card className="hover:shadow-lg cursor-pointer">
            <FiMapPin className="text-primary text-4xl mb-2" />
            <h3 className="font-bold text-lg">{t('driver.trips')}</h3>
            <p className="text-gray-600 text-sm">View all your trips</p>
          </Card>
        </Link>

        <Link href={`/${params.locale}/driver/earnings`}>
          <Card className="hover:shadow-lg cursor-pointer">
            <FiDollarSign className="text-primary text-4xl mb-2" />
            <h3 className="font-bold text-lg">{t('driver.earnings')}</h3>
            <p className="text-gray-600 text-sm">View your earnings details</p>
          </Card>
        </Link>
      </div>
    </div>
  )
}