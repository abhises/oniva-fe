'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from 'react-i18next'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { FiUser, FiPhone, FiGlobe } from 'react-icons/fi'

export default function ClientProfilePage() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('navigation.profile')}</h1>

        <Card>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.fullName}</h2>
              <p className="text-gray-600">{user?.role}</p>
            </div>
          </div>

          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FiUser size={20} className="text-primary" />
                <div>
                  <p className="text-sm text-gray-600">{t('auth.fullName')}</p>
                  <p className="font-semibold">{user?.fullName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FiPhone size={20} className="text-primary" />
                <div>
                  <p className="text-sm text-gray-600">{t('auth.phone')}</p>
                  <p className="font-semibold">{user?.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <FiGlobe size={20} className="text-primary" />
                <div>
                  <p className="text-sm text-gray-600">{t('common.language')}</p>
                  <p className="font-semibold">{user?.language.toUpperCase()}</p>
                </div>
              </div>

              <Button variant="secondary" onClick={() => setIsEditing(true)} fullWidth>
                {t('common.edit')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input label={t('auth.fullName')} value={user?.fullName} disabled />
              <Input label={t('auth.phone')} value={user?.phone} disabled />
              <div className="flex gap-4">
                <Button variant="primary" fullWidth>
                  {t('common.save')}
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)} fullWidth>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  )
}