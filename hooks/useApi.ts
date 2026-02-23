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

  const request = useCallback(
    async <T,>(apiCall: () => Promise<any>): Promise<T | null> => {
      setIsLoading(true);
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
          if (showError) {
            const errorKey = response.messageKey || 'errors.SERVER_ERROR';
            const errorMessage = t(errorKey);
            toast.error(errorMessage);
          }
          return null;
        }
      } catch (error: any) {
        if (showError) {
          const errorKey = error.response?.data?.messageKey || 'errors.NETWORK_ERROR';
          const errorMessage = t(errorKey);
          toast.error(errorMessage);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [t, showError, showSuccess]
  );

  return { isLoading, request };
};