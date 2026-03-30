'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useLocale } from './useLocale';

interface UseApiOptions {
  showError?: boolean;
  showSuccess?: boolean;
}

export const useApi = (options: UseApiOptions = {}) => {
  const { showError = true, showSuccess = true } = options;
  const { t } = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async <T,>(apiCall: () => Promise<any>): Promise<T | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiCall();

        if (response.success) {
          // Handle Toasts: fallback to regular message if messageKey is missing
          if (showSuccess) {
            if (response.messageKey) {
              toast.success(t(response.messageKey));
            } else if (response.message) {
              toast.success(response.message);
            }
          }
          
          // Fix: If there's no data payload, return true instead of undefined
          return (response.data !== undefined ? response.data : true) as T;
        } else {
          const errorKey = response.messageKey;
          
          // Fallback order:
          // 1. Translated using messageKey
          // 2. Direct message
          // 3. Translated Server Error
          const errorMessage = errorKey ? t(errorKey) : (response.message || t('errors.SERVER_ERROR'));
          setError(errorMessage);
          
          if (showError) {
            toast.error(errorMessage);
          }
          return null;
        }
      } catch (error: any) {
        const responseData = error.response?.data;
        const errorKey = responseData?.messageKey;
        
        // Fallback order: 
        // 1. Translated message using messageKey
        // 2. Direct message from backend
        // 3. Translated Network Error
        const errorMessage = errorKey ? t(errorKey) : (responseData?.message || t('errors.NETWORK_ERROR'));
        setError(errorMessage);

        if (showError) {
          toast.error(errorMessage);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [t, showError, showSuccess]
  );

  return { isLoading, request, error, setError };
};