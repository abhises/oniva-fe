 'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/services/api'
import { useTranslation } from './useTranslation'
import toast from 'react-hot-toast'


type UserRole = "client" | "driver";

type ApiResult = {
  success: boolean;
  message?: string;
  messageKey?: string;
  data?: {
    user: any;
  };
};


export const useAuth = () => {
  const router = useRouter()
  const { t ,locale} = useTranslation()
  const { 
    user, 
    isInitialized, 
    sessionChecked, 
    isCheckingSession,
    setAuth, 
    logout: storeLogout, 
    setSessionChecked,
    setIsCheckingSession
  } = useAuthStore()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      // Don't check if we already checked session or currently checking
      if (sessionChecked || isCheckingSession) return

      // If user is already set from store persistence
      if (user) {
        setSessionChecked(true)
        return
      }

      try {
        setIsCheckingSession(true)
        const response = await apiClient.getCurrentUser()
        if (response.success && response.data?.user) {
          setAuth(response.data.user)
        } else {
          storeLogout()
        }
      } catch (error) {
        storeLogout()
      } finally {
        setSessionChecked(true)
        setIsCheckingSession(false)
      }
    }

    checkSession()
  }, [sessionChecked, isCheckingSession, setAuth, storeLogout, user, setSessionChecked, setIsCheckingSession])

  const authReady = isInitialized && sessionChecked

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

    if (!response.success) {
      throw {
        response: {
          data: response,
        },
      };
    }

    // success path
    if (response.data?.token) {
      document.cookie = `token=${response.data.token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;
    }
    setAuth(response.data!.user, response.data?.token);
    const message = response.messageKey
      ? t(response.messageKey)
      : response.message;

    toast.success(message || 'Registration successful!');
    router.push(`/${locale}/${role.toLowerCase()}/dashboard`);

    return response;
  },
  [setAuth, router, locale, t]
);

  const login = useCallback(
    async (phone: string, password: string) => {
      try {
        const response = await apiClient.login({phone, password});

        if (response.success && response.data) {
          if (response.data.token) {
            document.cookie = `token=${response.data.token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;
          }
          setAuth(response.data.user, response.data.token);
          
          // Use messageKey from response
          const message = response.messageKey ? t(response.messageKey) : response.message;
          toast.success(message || 'Login successful!');
          
          router.push(`/${locale}/${response.data.user.role.toLowerCase()}/dashboard`);
        }
      } catch (error: any) {
        const errorKey = error.response?.data?.messageKey || 'errors.INVALID_CREDENTIALS';
        const errorMessage = t(errorKey) || error.response?.data?.message || 'Login failed';
        toast.error(errorMessage);
      }
    },
    [setAuth, router, locale, t]
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      // continue with client logout even if backend logout fails
    }
    document.cookie = "token=; Path=/; Max-Age=0; SameSite=None; Secure";
    storeLogout()
    toast.success(t('common.logout'))
    router.push('/')
  }, [storeLogout, router, t])

  const hasRole = useCallback(
    (role: string | string[]) => {
      if (!user) return false
      if (Array.isArray(role)) {
        return role.includes(user.role)
      }
      return user.role === role
    },
    [user]
  )

  return {
    user,
    isAuthenticated: !!user,
    isInitialized: authReady,
    register,
    login,
    logout,
    hasRole,
    loading, setLoading
  }
}