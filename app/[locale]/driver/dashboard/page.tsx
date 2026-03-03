"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { StatsCard } from "@/components/common/StatsCard";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import Link from "next/link";
import { FiMapPin, FiDollarSign, FiStar, FiTrendingUp } from "react-icons/fi";
import { use } from "react";
import { useRouter } from "next/navigation";

interface AcceptResponse {
  success: boolean;
  trip_id: number | string;
  message?: string;
}

export default function DriverDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isLoading, request } = useApi({ showSuccess: true });
  const { locale } = use(params);
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    totalTrips: 0,
    earnings: 0,
    rating: 5.0,
  });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    const updateStatusAndLocation = async () => {
      await request(() => apiClient.setOnlineStatus(isOnline));

      if (isOnline) {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                await request(() =>
                  apiClient.updateLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  }),
                );
                console.log(
                  "📍 Driver location updated to:",
                  position.coords.latitude,
                  position.coords.longitude,
                );
              } catch (err) {
                console.error("Failed to update location", err);
              }
            },
            (error) => {
              console.error(
                "Browser location error. Make sure Chrome Sensors are active!",
                error,
              );
            },
          );
        }
      }
    };

    updateStatusAndLocation();
  }, [isOnline, request]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (isOnline) {
        const result = await request<[]>(() => apiClient.getPendingRequests());
        if (result) {
          setPendingRequests(result);
        }
      }
    };

    const interval = isOnline ? setInterval(fetchRequests, 5000) : undefined;
    fetchRequests();

    return () => clearInterval(interval);
  }, [isOnline, request]);

  const handleAccept = async (requestId: string) => {
    // Use the interface instead of any
    const result = await request<AcceptResponse>(() =>
      apiClient.acceptRequest(requestId),
    );

    if (result?.trip_id) {
      router.push(`/${locale}/driver/driver-trips/${result.trip_id}`);
    }
  };

  const handleReject = async (requestId: string) => {
    await request(() => apiClient.rejectRequest(requestId, "Too far away"));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {t("common.welcome")} {user?.fullName}!
        </h1>
        <Button
          variant={isOnline ? "danger" : "success"}
          onClick={() => setIsOnline(!isOnline)}
          isLoading={isLoading}
        >
          {isOnline ? t("driver.goOffline") : t("driver.goOnline")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          label={t("driver.totalTrips")}
          value={stats.totalTrips}
          icon={<FiMapPin />}
          trend="up"
          trendValue="5 this week"
        />
        <StatsCard
          label={t("driver.totalEarnings")}
          value={`${stats.earnings.toLocaleString()} XOF`}
          icon={<FiDollarSign />}
          trend="up"
          trendValue="15% from last week"
        />
        <StatsCard
          label={t("driver.rating")}
          value={stats.rating.toFixed(1)}
          icon={<FiStar />}
          trend="up"
          trendValue="Based on 45 ratings"
        />
      </div>

      {isOnline && (
        <Card>
          <h2 className="text-2xl font-bold mb-4">
            {t("driver.pendingRequests")}
          </h2>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              {t("common.loading")}
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                // 1. Fixed Key mapping
                <div
                  key={req.request_id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FiMapPin size={16} className="text-primary" />
                        {req.pickup_address}
                      </h3>
                      <p className="text-sm text-gray-600 ml-6">
                        → {req.destination_address}
                      </p>
                    </div>
                    {/* 2. Fixed distance mapping (from your socket output: estimated_distance) */}
                    <Badge
                      variant="warning"
                      label={`${req.estimated_distance} km`}
                    />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">
                        {t("client.estimatedFare")}
                      </p>
                      <p className="font-bold text-primary">
                        {req.total_price} XOF
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        // 3. Fixed ID passing for API call
                        onClick={() => handleAccept(req.request_id)}
                        isLoading={isLoading}
                      >
                        {t("driver.accept")}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        // 4. Fixed ID passing for API call
                        onClick={() => handleReject(req.request_id)}
                        isLoading={isLoading}
                      >
                        {t("driver.reject")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <Link href={`/${locale}/driver/driver-trips`}>
          <Card className="hover:shadow-lg cursor-pointer">
            <FiMapPin className="text-primary text-4xl mb-2" />
            <h3 className="font-bold text-lg">{t("driver.trips")}</h3>
            <p className="text-gray-600 text-sm">
              {t("driver.viewAllYourTrips")}
            </p>
          </Card>
        </Link>

        <Link href={`/${locale}/driver/earnings`}>
          <Card className="hover:shadow-lg cursor-pointer">
            <FiDollarSign className="text-primary text-4xl mb-2" />
            <h3 className="font-bold text-lg">{t("driver.earnings")}</h3>
            <p className="text-gray-600 text-sm">
              {t("driver.viewEarningsDetails")}
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
