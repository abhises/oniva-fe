'use client'
import { useEffect, useState } from 'react'
import { use } from 'react'
import { useLocale } from '@/hooks/useLocale'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/common/Card'
import { StatsCard } from '@/components/common/StatsCard'
import { Loader } from '@/components/common/Loader'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { FiDollarSign, FiTrendingUp, FiUsers } from 'react-icons/fi'

interface EarningsStats {
  totalPlatformEarnings: number
  totalDriverEarnings: number
  totalCommission: number
  commissionPercentage: number
  totalTrips: number
  averageCommissionPerTrip: number
  monthlyData?: Array<{
    month: string
    platformEarnings: number
    driverEarnings: number
    commission: number
  }>
}

interface AdminEarningsPageProps {
  params: Promise<{ locale: string }>
}

export default function AdminEarningsPage({ params }: AdminEarningsPageProps) {
  const { locale } = use(params)
  const { t } = useLocale()
  const { isLoading, request } = useApi({ showError: true, showSuccess: false })
  const [earnings, setEarnings] = useState<EarningsStats | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    const fetchEarnings = async () => {
      const data = await request<EarningsStats>(() =>
        apiClient.getAdminEarnings({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
      )

      if (data) {
        setEarnings(data)
      } else {
        setEarnings(null)
      }
    }

    fetchEarnings()
  }, [dateRange, request])

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('admin.platformEarnings')}</h1>

        {/* Date Range Filter */}
        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('common.startDate')}
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('common.endDate')}
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({ ...dateRange, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </Card>

        {isLoading ? (
          <Loader />
        ) : earnings ? (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                label={t('admin.platformCommission')}
                value={`${earnings.totalPlatformEarnings.toLocaleString()} XOF`}
                icon={<FiDollarSign />}
                trend="up"
                trendValue={t('admin.selectedPeriod', 'In selected period')}
              />
              <StatsCard
                label={t('admin.driverEarnings')}
                value={`${earnings.totalDriverEarnings.toLocaleString()} XOF`}
                icon={<FiTrendingUp />}
                trend="up"
                trendValue={t('admin.selectedPeriod', 'In selected period')}
              />
              <StatsCard
                label={t('admin.totalRevenue')}
                value={`${(earnings.totalPlatformEarnings + earnings.totalDriverEarnings).toLocaleString()} XOF`}
                icon={<FiDollarSign />}
                trend="up"
                trendValue={t('admin.selectedPeriod', 'In selected period')}
              />
            </div>

            {/* Commission Breakdown */}
            <Card className="mb-8">
              <h2 className="text-2xl font-bold mb-6">{t('admin.commissionBreakdown')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    {t('admin.totalTrips')}
                  </p>
                  <p className="text-4xl font-bold text-primary mb-4">
                    {earnings.totalTrips}
                  </p>

                  <p className="text-sm text-gray-600 mb-2">
                    {t('admin.averageCommissionPerTrip')}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {earnings.averageCommissionPerTrip} XOF
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">
                    {t('admin.commissionRate')}: {earnings.commissionPercentage}%
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('admin.platformKeeps')}</span>
                      <span className="font-bold">
                        {earnings.commissionPercentage}%
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-700">{t('admin.driversGet')}</span>
                      <span className="font-bold">
                        {100 - earnings.commissionPercentage}%
                      </span>
                    </div>

                    <div className="border-t pt-3 flex justify-between">
                      <span className="text-gray-700">{t('admin.totalRevenueLabel')}</span>
                      <span className="font-bold">100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Monthly Data */}
            {earnings.monthlyData && earnings.monthlyData.length > 0 && (
              <Card>
                <h2 className="text-2xl font-bold mb-6">{t('admin.monthlyBreakdown')}</h2>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-4 font-semibold">{t('common.period')}</th>
                        <th className="text-right p-4 font-semibold">
                          {t('admin.platformCommission')}
                        </th>
                        <th className="text-right p-4 font-semibold">
                          {t('admin.driverEarnings')}
                        </th>
                        <th className="text-right p-4 font-semibold">
                          {t('admin.totalRevenue')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.monthlyData.map((month, idx) => (
                        <tr
                          key={idx}
                          className="border-b hover:bg-gray-50 transition"
                        >
                          <td className="p-4 font-semibold">{month.month}</td>
                          <td className="p-4 text-right text-green-600">
                            {month.commission.toLocaleString()} XOF
                          </td>
                          <td className="p-4 text-right text-blue-600">
                            {month.driverEarnings.toLocaleString()} XOF
                          </td>
                          <td className="p-4 text-right font-semibold">
                            {(
                              month.commission + month.driverEarnings
                            ).toLocaleString()}{' '}
                            XOF
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card className="text-center py-12">
            <p className="text-gray-600">{t('admin.noEarningsData')}</p>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}