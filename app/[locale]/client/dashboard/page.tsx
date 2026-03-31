'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useApi } from '@/hooks/useApi';
import { apiClient } from '@/services/api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/common/Button';
import { StatsCard } from '@/components/common/StatsCard';
import Link from 'next/link';
import { FiTrendingUp, FiMap, FiNavigation } from 'react-icons/fi';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { request } = useApi({ showSuccess: false });

  const [stats, setStats] = useState({ totalDistance: 0, totalRides: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const result = await request<any>(() => apiClient.getClientDashboardStats());
      if (result) {
        setStats({
          totalDistance: result.totalDistance || 0,
          totalRides: result.totalRides || 0,
        });
      }
    };
    fetchStats();
  }, [request]);

  const avgDistance = stats.totalRides > 0 ? stats.totalDistance / stats.totalRides : 0;

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          {t('common.welcome')}, {user?.fullName}!
        </h1>

        <div className="flex gap-4 mb-6 justify-end">
          <Link href={`/${locale}/client/book-trip`}>
            <Button variant="primary" size="lg">
              {t('client.bookTrip')}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard
            label={t('client.totalDistance')}
            value={`${stats.totalDistance.toFixed(1)} km`}
            icon={<FiMap />}
            trend="up"
            trendValue={t('client.totalCovered')}
          />
          <StatsCard
            label={t('client.totalRides')}
            value={stats.totalRides}
            icon={<FiTrendingUp />}
            trend="up"
            trendValue={t('client.totalTaken')}
          />
          <StatsCard
            label={t('client.avgDistance')}
            value={`${avgDistance.toFixed(1)} km`}
            icon={<FiNavigation />}
            trend="up"
            trendValue={t('client.avgPerRide')}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}