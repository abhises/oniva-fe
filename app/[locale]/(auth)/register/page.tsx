'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import type { UserRole } from '@/types/auth';


type SignupFormData = {
  phone: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};

export default function SignupPage() {
  const { t, locale } = useLocale();
  const { register } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    phone: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'client',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert(t('errors.password_mismatch'));
      return;
    }

    setIsLoading(true);
    try {
      await register(formData.phone, formData.fullName, formData.password, formData.role);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary to-secondary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-dark mb-8">
          {t('auth.signup')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('auth.fullName')}
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <Input
            label={t('auth.phone')}
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <Select
            label={t('auth.role')}
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={[
              { value: 'client', label: t('auth.client') },
              { value: 'driver', label: t('auth.driver') },
            ]}
          />

          <Input
            label={t('auth.password')}
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            label={t('auth.confirm_password')}
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            {t('auth.signup')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('auth.have_account')}{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              {t('auth.signin')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}