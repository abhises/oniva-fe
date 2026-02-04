'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { StatsCard } from '@/components/common/StatsCard'
import { Loader } from '@/components/common/Loader'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import Link from 'next/link'
import { FiUsers, FiTrendingUp, FiDollarSign, FiAlertCircle } from 'react-icons/fi'

interface DashboardData {
  activeDrivers: number
  completedTrips: number
  totalRevenue: number
  platformCommission: number
  pendingApprovals: number
}

export default function AdminDashboard({ params }: { params: { locale: string } }) {
  const { t } = useTranslation()
  const { isLoading, request } = useApi({ showError: true })
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      const result = await request<DashboardData>(() => apiClient.getAdminDashboard())
      if (result) {
        setDashboard(result)
      }
    }
    fetchDashboard()
  }, [request])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('admin.dashboard')}</h1>

      {isLoading ? (
        <Loader />
      ) : dashboard ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              label={t('admin.activeDrivers')}
              value={dashboard.activeDrivers}
              icon={<FiUsers />}
              trend="up"
              trendValue="5 new this week"
            />
            <StatsCard
              label={t('admin.completedTrips')}
              value={dashboard.completedTrips}
              icon={<FiTrendingUp />}
            />
            <StatsCard
              label={t('admin.totalRevenue')}
              value={`${dashboard.totalRevenue.toLocaleString()} XOF`}
              icon={<FiDollarSign />}
              trend="up"
              trendValue="8% growth"
            />
            <StatsCard
              label="Pending Approvals"
              value={dashboard.pendingApprovals}
              icon={<FiAlertCircle />}
              trend="down"
              trendValue="3 waiting"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href={`/${params.locale}/admin/drivers`}>
              <Card className="hover:shadow-lg cursor-pointer">
                <FiUsers className="text-primary text-4xl mb-4" />
                <h3 className="font-bold text-lg mb-2">{t('admin.drivers')}</h3>
                <p className="text-gray-600 text-sm">{dashboard.activeDrivers} active drivers</p>
              </Card>
            </Link>

            <Link href={`/${params.locale}/admin/reports`}>
              <Card className="hover:shadow-lg cursor-pointer">
                <FiDollarSign className="text-primary text-4xl mb-4" />
                <h3 className="font-bold text-lg mb-2">{t('admin.reports')}</h3>
                <p className="text-gray-600 text-sm">Revenue & Analytics</p>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card>
            <h2 className="text-2xl font-bold mb-4">{t('common.recentActivity')}</h2>
            <div className="space-y-2">
              <p className="text-gray-600">No recent activity</p>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}