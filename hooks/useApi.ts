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
          if (showSuccess && response.messageKey) {
            const message = t(response.messageKey);
            toast.success(message);
          }
          return response.data as T;
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