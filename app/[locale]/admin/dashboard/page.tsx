'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/common/Card'
import { StatsCard } from '@/components/common/StatsCard'
import { Loader } from '@/components/common/Loader'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import Link from 'next/link'
import {
  FiUsers,
  FiTrendingUp,
  FiDollarSign,
  FiAlertCircle,
} from 'react-icons/fi'
import { use } from 'react'


interface DashboardData {
  activeDrivers: number
  completedTrips: number
  totalRevenue: number
  platformCommission: number
  pendingApprovals: number
}

// ✅ Safe number formatter
const formatNumber = (value?: number) =>
  typeof value === 'number' ? value.toLocaleString() : '0'

export default function AdminDashboard({ 
  params 
}: { 
  params: Promise<{ locale: string }>  // Now it's a Promise!
}) {
  const { t } = useTranslation()
  const { isLoading, request } = useApi({ showError: true })
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const { locale } = use(params)  // Must unwrap with use()

  useEffect(() => {
    const fetchDashboard = async () => {
      const result = await request<DashboardData>(() =>
        apiClient.getAdminDashboard()
      )

      // ✅ Normalize API response (no undefined allowed)
      if (result) {
        setDashboard({
          activeDrivers: result.activeDrivers ?? 0,
          completedTrips: result.completedTrips ?? 0,
          totalRevenue: result.totalRevenue ?? 0,
          platformCommission: result.platformCommission ?? 0,
          pendingApprovals: result.pendingApprovals ?? 0,
        })
      }
    }

    fetchDashboard()
  }, [request])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {t('admin.dashboard')}
      </h1>

      {isLoading ? (
        <Loader />
      ) : dashboard ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              label={t('admin.activeDrivers')}
              value={formatNumber(dashboard.activeDrivers)}
              icon={<FiUsers />}
              trend="up"
              trendValue="5 new this week"
            />

            <StatsCard
              label={t('admin.completedTrips')}
              value={formatNumber(dashboard.completedTrips)}
              icon={<FiTrendingUp />}
            />

            <StatsCard
              label={t('admin.totalRevenue')}
              value={`${formatNumber(dashboard.totalRevenue)} XOF`}
              icon={<FiDollarSign />}
              trend="up"
              trendValue="8% growth"
            />

            <StatsCard
              label={t('admin.pendingApprovals')}
              value={formatNumber(dashboard.pendingApprovals)}
              icon={<FiAlertCircle />}
              trend="down"
              trendValue="3 waiting"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href={`/${locale}/admin/drivers`}>
              <Card className="hover:shadow-lg cursor-pointer">
                <FiUsers className="text-primary text-4xl mb-4" />
                <h3 className="font-bold text-lg mb-2">
                  {t('admin.drivers')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {formatNumber(dashboard.activeDrivers)} active drivers
                </p>
              </Card>
            </Link>

            <Link href={`/${locale}/admin/reports`}>
              <Card className="hover:shadow-lg cursor-pointer">
                <FiDollarSign className="text-primary text-4xl mb-4" />
                <h3 className="font-bold text-lg mb-2">
                  {t('admin.reports')}
                </h3>
                <p className="text-gray-600 text-sm">
                  Revenue & Analytics
                </p>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card>
            <h2 className="text-2xl font-bold mb-4">
              {t('common.recentActivity')}
            </h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                No recent activity
              </p>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
