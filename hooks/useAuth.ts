 'use client'

import { useCallback,useState } from 'react'
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
    token: string;
  };
};


export const useAuth = () => {
  const router = useRouter()
  const { t ,locale} = useTranslation()
  const { user, token, isInitialized, setAuth, logout: storeLogout } = useAuthStore()
  const [loading, setLoading] = useState(false)

  // ← NEW: Helper to set token in cookie (for middleware)
  const setTokenCookie = (token: string) => {
    document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`
  }

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
    storeLogout()
    // ← NEW: Clear cookie on logout
    document.cookie = 'token=; path=/; max-age=0'
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
    token,
    isAuthenticated: !!token,
    isInitialized,  // ← NEW: Return this for Header/ProtectedRoute
    register,
    login,
    logout,
    hasRole,
    loading, setLoading
  }
}