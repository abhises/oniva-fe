// app/driver/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useApi } from "@/hooks/useApi" // Import your custom hook
import { apiClient } from '@/services/api'
import { Loader } from '@/components/common/Loader'


interface DriverStatusResponse {
  success: boolean;
  status: 'none' | 'pending' | 'approved' | 'rejected';
}

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isVerifying, setIsVerifying] = useState(true)
  
  // Use the same request pattern as your Profile page
  const { request } = useApi({ showSuccess: false });

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // Use the request hook with the specific interface
        const result = await request<DriverStatusResponse>(() =>
          apiClient.checkDriverStatus()
        );

        // If result is null, the hook likely handled the error
        if (!result) return;

        const status = result.status;

        if (status === 'none') {
          if (pathname !== '/driver/setup') {
            router.replace('/driver/setup');
          }
        } 
        else if (status === 'pending') {
          if (pathname !== '/driver/pending') {
            router.replace('/driver/pending');
          }
        } 
        else if (status === 'approved') {
          // If approved, don't let them stay on setup or pending
          if (pathname === '/driver/setup' || pathname === '/driver/pending') {
            router.replace('/driver/dashboard');
          }
        }
      } catch (error) {
        console.error("Status check failed:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    checkOnboardingStatus();
  }, [pathname, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}