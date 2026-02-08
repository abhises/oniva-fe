'use client';

import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/common/Button';
import Link from 'next/link';
import { FiMapPin, FiClock, FiDollarSign } from 'react-icons/fi';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { t, locale } = useLocale();

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">
          {t('common.welcome')}, {user?.fullName}!
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href={`/${locale}/client/book-trip`}>
            <Button variant="primary" size="lg" fullWidth>
              {t('client.bookTrip')}
            </Button>
          </Link>

          <Link href={`/${locale}/client/estimate-fare`}>
            <Button variant="secondary" size="lg" fullWidth>
              {t('client.estimateFare')}
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">{t('client.myTrips')}</h2>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}