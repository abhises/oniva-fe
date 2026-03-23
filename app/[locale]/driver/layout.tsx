"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/services/api";
import { Loader } from "@/components/common/Loader";
import { useApi } from "@/hooks/useApi";

interface DriverStatusData {
  success: boolean;
  status: "none" | "pending" | "approved" | "rejected";
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale || "en";
  const { isInitialized } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const { request } = useApi({ showSuccess: false });

  useEffect(() => {
    if (!isInitialized) return;

    const checkOnboardingStatus = async () => {
      try {
        // Pass the interface <DriverStatusData> here
        const result = await request<DriverStatusData>(() =>
          apiClient.checkDriverStatus(),
        );

        // result is now typed as { status: 'none' | 'pending' ... } | null
        if (!result) return;

        console.log("Onboarding Status Result:", result.status);

        const status = result.status; // No more TS error!

        const isOnSetup = pathname.endsWith("/driver/setup");
        const isOnPending = pathname.endsWith("/driver/pending");

        if (status === "none" && !isOnSetup) {
          return router.replace(`/${locale}/driver/setup`);
        }

        if (status === "pending" && !isOnPending) {
          return router.replace(`/${locale}/driver/pending`);
        }

        if (status === "approved" && (isOnSetup || isOnPending)) {
          return router.replace(`/${locale}/driver/dashboard`);
        }

        setIsVerifying(false);
      } catch (error) {
        console.error("Guard Error:", error);
        setIsVerifying(false);
      }
    };

    checkOnboardingStatus();
  }, [isInitialized, pathname, locale, router]);
  // IMPORTANT: Do not render children until we are sure they are on the right page
  if (!isInitialized || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}
