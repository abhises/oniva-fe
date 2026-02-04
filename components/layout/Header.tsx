'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/hooks/useTranslation'
import { LanguageSwitcher } from './LanguageSwitcher'
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi'

export const Header = ({ locale }: { locale: string }) => {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="text-2xl font-bold text-primary">
            ONIVA
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            {user && (
              <Link href={`/${locale}/${user.role}/dashboard`} className="text-gray-700 hover:text-primary">
                {t('navigation.home')}
              </Link>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher locale={locale} />

            {/* User Menu */}
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-700 hover:text-danger"
              >
                <FiLogOut /> {t('common.logout')}
              </button>
            ) : (
              <Link href={`/${locale}/login`} className="btn btn-primary">
                {t('auth.login')}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t pt-4 space-y-2">
            {user && (
              <Link
                href={`/${locale}/${user.role}/dashboard`}
                className="block px-4 py-2 hover:bg-gray-100"
              >
                {t('navigation.home')}
              </Link>
            )}
            <div className="px-4">
              <LanguageSwitcher locale={locale} />
            </div>
            {user && (
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-danger hover:bg-gray-100"
              >
                {t('common.logout')}
              </button>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}