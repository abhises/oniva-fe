"use client";

import { useEffect, useState, use } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { 
  FiUser, 
  FiPhone, 
  FiStar, 
  FiMapPin, 
  FiClock, 
  FiArrowLeft 
} from "react-icons/fi";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";

export default function RequestDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string; locale: string }> 
}) {
  const { id, locale } = use(params);
  const { t } = useTranslation();
  const router = useRouter();
  
  const { isLoading, request } = useApi({ showSuccess: false });
  const [details, setDetails] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Fetch request details
  useEffect(() => {
    const fetchDetails = async () => {
      const result = await request<any>(() => apiClient.getRequestById(id));
      // Note: useApi usually returns result.data or result directly depending on your hook logic
      if (result) {
        setDetails(result);
      }
    };
    fetchDetails();
  }, [id, request]);

  // Expiry Timer Logic
  useEffect(() => {
    if (!details?.expires_at) return;

    const timer = setInterval(() => {
      const expiry = new Date(details.expires_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [details]);

  const handleAccept = async () => {
    const result = await request<any>(() => apiClient.acceptRequest(id));
    if (result?.trip_id) {
      router.push(`/${locale}/driver/driver-trips/${result.trip_id}`);
    }
  };

  const handleReject = async () => {
    await request(() => apiClient.rejectRequest(id, "Declined by driver"));
    router.push(`/${locale}/driver/dashboard`);
  };

  if (isLoading && !details) {
    return <div className="p-10 text-center">{t("common.loading")}</div>;
  }

  if (!details) {
    return (
      <div className="p-10 text-center">
        <p className="mb-4 text-gray-600">{t("driver.requestNotFoundOrExpired")}</p>
        <Button onClick={() => router.push(`/${locale}/driver/dashboard`)}>
          {t("common.backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-24 space-y-4">
      <div className="flex items-center gap-4 mb-2">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <FiArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold">{t("driver.newRequest")}</h1>
      </div>

      {/* Countdown Timer */}
      {timeLeft !== null && (
        <div className={`text-center p-3 rounded-xl font-bold ${timeLeft < 30 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-700'}`}>
          <FiClock className="inline-block mr-2" />
          {t("driver.expiresIn")}: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      )}

      {/* Client Profile Card */}
      <Card className="border-l-4 border-primary shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
            <FiUser size={28} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{details.client_name}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="flex items-center text-yellow-500 font-bold">
                <FiStar className="fill-current mr-1" /> 5.0
              </span>
              <span>• {details.client_total_rides || 0} {t("driver.rides")}</span>
            </div>
          </div>
          <a 
            href={`tel:${details.client_phone}`} 
            className="p-3 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition"
          >
            <FiPhone size={20} />
          </a>
        </div>
      </Card>

      {/* Trip Details Card */}
      <Card>
        <div className="space-y-6 relative">
          <div className="absolute left-[9px] top-6 bottom-6 w-0.5 bg-gray-100" />
          
          <div className="flex gap-4 relative z-10">
            <div className="h-5 w-5 rounded-full bg-green-500 border-4 border-white shadow-sm mt-1" />
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">{t("driver.pickup")}</p>
              <p className="text-sm font-medium">{details.pickup_address}</p>
            </div>
          </div>
          
          <div className="flex gap-4 relative z-10">
            <div className="h-5 w-5 rounded-full bg-red-500 border-4 border-white shadow-sm mt-1" />
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase">{t("driver.destination")}</p>
              <p className="text-sm font-medium">{details.destination_address}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t">
          <div className="bg-gray-50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">{t("driver.distance")}</p>
            <p className="font-bold">{details.estimated_distance} km</p>
          </div>
          <div className="bg-primary/5 p-3 rounded-lg text-center">
            <p className="text-xs text-primary mb-1">{t("driver.fare")}</p>
            <p className="font-bold text-primary">{details.total_price?.toLocaleString()} XOF</p>
          </div>
        </div>
      </Card>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-4 max-w-md mx-auto z-20">
        <Button 
        //   variant="outline" 
          className="flex-1 border-red-200 text-red-600" 
          onClick={handleReject}
          disabled={isLoading}
        >
          {t("driver.decline")}
        </Button>
        <Button 
          variant="success" 
          className="flex-1 shadow-lg" 
          onClick={handleAccept}
          isLoading={isLoading}
        //   disabled={timeLeft === 0}
        >
          {t("driver.accept")}
        </Button>
      </div>
    </div>
  );
}