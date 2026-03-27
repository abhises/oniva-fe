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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <Link href={`/${locale}/client/book-trip`}>
            <Button variant="primary" size="lg" fullWidth>
              {t('client.bookTrip')}
            </Button>
          </Link>


        </div>


      </div>
    </ProtectedRoute>
  );
}