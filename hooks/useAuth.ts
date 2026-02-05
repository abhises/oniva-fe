'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import { useLocale } from './useLocale';
import toast from 'react-hot-toast';

type UserRole = "client" | "driver";


export const useAuth = () => {
  const router = useRouter();
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();
  const { t, locale } = useLocale();

  const register = useCallback(
    async (phone: string, fullName: string, password: string, role: UserRole) => {
      try {
        const response = await apiClient.register({phone, fullName, password, role});

        if (response.success && response.data) {
          setAuth(response.data.user, response.data.token);
          
          // Use messageKey from response
          const message = response.messageKey ? t(response.messageKey) : response.message;
          toast.success(message || 'Registration successful!');
          
          router.push(`/${locale}/${role}/dashboard`);
        }
      } catch (error: any) {
        const errorKey = error.response?.data?.messageKey || 'errors.SERVER_ERROR';
        const errorMessage = t(errorKey) || error.response?.data?.message || 'Registration failed';
        toast.error(errorMessage);
      }
    },
    [setAuth, router, locale, t]
  );

  const login = useCallback(
    async (phone: string, password: string) => {
      try {
        const response = await apiClient.login({phone, password});

        if (response.success && response.data) {
          setAuth(response.data.user, response.data.token);
          
          // Use messageKey from response
          const message = response.messageKey ? t(response.messageKey) : response.message;
          toast.success(message || 'Login successful!');
          
          router.push(`/${locale}/${response.data.user.role}/client-dashboard`);
        }
      } catch (error: any) {
        const errorKey = error.response?.data?.messageKey || 'errors.INVALID_CREDENTIALS';
        const errorMessage = t(errorKey) || error.response?.data?.message || 'Login failed';
        toast.error(errorMessage);
      }
    },
    [setAuth, router, locale, t]
  );

  const logout = useCallback(() => {
    storeLogout();
    const message = t('auth.LOGOUT_SUCCESS');
    toast.success(message);
    router.push(`/${locale}/login`);
  }, [storeLogout, router, locale, t]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    register,
    login,
    logout,
  };
};