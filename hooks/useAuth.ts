'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/services/api';
import { useLocale } from './useLocale';
import toast from 'react-hot-toast';

type UserRole = "client" | "driver";

type ApiResult = {
  success: boolean;
  message?: string;
  messageKey?: string;
  data?: {
    user: any;
    token: string;
  };
};



export const useAuth = () => {
  const router = useRouter();
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();
  const { t, locale } = useLocale();

 const register = useCallback(
  async (
    phone: string,
    fullName: string,
    password: string,
    role: UserRole
  ): Promise<ApiResult> => {
    const response = await apiClient.register({
      phone,
      fullName,
      password,
      role,
    });

    // 🔥 MANUAL ERROR THROW
    if (!response.success) {
      throw {
        response: {
          data: response,
        },
      };
    }

    // success path
    setAuth(response.data!.user, response.data!.token);

    const message = response.messageKey
      ? t(response.messageKey)
      : response.message;

    toast.success(message || 'Registration successful!');
    router.push(`/${locale}/${role}/dashboard`);

    return response;
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
          
          router.push(`/${locale}/${response.data.user.role}/dashboard`);
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