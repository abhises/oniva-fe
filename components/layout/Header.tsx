'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';

export const Header = ({ locale }: { locale: string }) => {
  const { user, logout } = useAuth();
  const { t, isReady } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ⛔ IMPORTANT: prevent hydration mismatch
  if (!isReady) {
    return null; // or a skeleton/header placeholder
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link href={`/${locale}`} className="text-2xl font-bold text-primary">
            ONIVA
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {user && (
              <Link href={`/${locale}/${user.role}/dashboard`}>
                {t('navigation.home')}
              </Link>
            )}
            {user && user.role === 'client' && (
              <>
              <Link href={`/${locale}/${user.role}/profile`}>
                {t('navigation.profile')}
              </Link>
              <Link href={`/${locale}/${user.role}/book-trip`}>
                {t('client.bookTrip')}
              </Link>
               <Link href={`/${locale}/${user.role}/client-trips`}>
                {t('client.myTrips')}
              </Link>
              </>
            )}

            <LanguageSwitcher locale={locale} />

            {user ? (
              <button onClick={logout} className="flex items-center gap-2">
                <FiLogOut /> {t('common.logout')}
              </button>
            ) : (
              <Link href={`/${locale}/login`} className="btn btn-primary">
                {t('auth.login')}
              </Link>
            )}
          </nav>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};
