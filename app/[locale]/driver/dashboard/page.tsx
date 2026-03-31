"use client";

import { useEffect, useState, useCallback } from "react";
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
import { io } from "socket.io-client";
import toast from "react-hot-toast";

interface AcceptResponse {
  success: boolean;
  trip_id: number | string;
  message?: string;
}

interface DriverStatsResponse {
  total_trips: string | number;
  total_earnings: string | number;
  rating: string | number;
  trips_this_week: string | number;
  earnings_this_week: string | number;
}

export default function DriverDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isLoading, request } = useApi({ showSuccess: false });
  const { locale } = use(params);
  const router = useRouter();

  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    totalTrips: 0,
    earnings: 0,
    rating: 5.0,
    tripsThisWeek: 0,
    totalKm: 0,
    earningsThisWeek: 0,
  });
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  // 1. Reusable function to push location to backend
  const updateLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await apiClient.updateLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            console.log(
              "📍 Location updated:",
              position.coords.latitude,
              position.coords.longitude,
            );
          } catch (err) {
            console.error("Failed to update location", err);
          }
        },
        (error) => {
          console.error("Location error:", error);
        },
      );
    }
  }, []);

  // 2. Fetch initial data on mount (Stats + Current Online Status)
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch Stats
      const statsResult = await request<any>(() =>
        apiClient.getDriverDashboardStats(),
      );
      if (statsResult) {
        setStats({
          totalTrips: Number(statsResult.total_trips) || 0,
          earnings: Number(statsResult.total_earnings) || 0,
          rating: Number(statsResult.rating) || 0,
          tripsThisWeek: Number(statsResult.trips_this_week) || 0,
          totalKm: Number(statsResult.total_km) || 0,
          earningsThisWeek: Number(statsResult.earnings_this_week) || 0,
        });
      }

      // Fetch Profile to see if they are ALREADY online in the database
      const profileResult = await request<any>(() =>
        apiClient.getDriverProfile(),
      );
      const actualProfile = profileResult?.data || profileResult;

      if (actualProfile && actualProfile.is_online) {
        setIsOnline(true);
        updateLocation(); // Push location since they are already active
      }
    };

    fetchInitialData();
  }, [request, updateLocation]);

  // 3. Handle explicit button click to toggle status
  const handleToggleOnline = async () => {
    const newStatus = !isOnline;

    // Update UI immediately for responsiveness
    setIsOnline(newStatus);

    try {
      // Send explicit request to backend
      await apiClient.setOnlineStatus(newStatus);

      if (newStatus) {
        toast.success(t("driver.wentOnline") || "You are now online!");
        updateLocation();
        fetchRequests(); // Fetch immediately upon going online
      } else {
        toast.success(t("driver.wentOffline") || "You are now offline.");
        setPendingRequests([]); // Clear requests when going offline
      }
    } catch (error) {
      // If API fails, revert the button state back
      setIsOnline(!newStatus);
      toast.error("Failed to change status. Please try again.");
    }
  };

  const fetchRequests = useCallback(async () => {
    if (isOnline) {
      const result = await request<any[]>(() => apiClient.getPendingRequests());
      if (result) {
        setPendingRequests(result);
      }
    }
  }, [isOnline, request]);

  // Fetch requests if online (runs after the initial profile fetch sets isOnline to true)
  useEffect(() => {
    if (isOnline) {
      fetchRequests();
    }
  }, [isOnline, fetchRequests]);

  // Socket connection
  useEffect(() => {
    if (isOnline && user?.id) {
      const socketUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const socket = io(socketUrl);

      socket.emit("auth", { userId: user.id, userRole: "driver" });

      socket.on("new_booking_request", (data) => {
        console.log("New booking received via socket:", data);
        fetchRequests();
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOnline, user?.id, fetchRequests]);

  const handleAccept = async (requestId: string) => {
    const result = await request<AcceptResponse>(() =>
      apiClient.acceptRequest(requestId),
    );

    if (result?.trip_id) {
      router.push(`/${locale}/driver/driver-trips/${result.trip_id}`);
    }
  };

  const handleReject = async (requestId: string) => {
    await request(() => apiClient.rejectRequest(requestId, "Too far away"));
    fetchRequests(); // Refresh list after rejecting
  };

  const avgEarningPerTrip = stats.totalTrips > 0 ? stats.earnings / stats.totalTrips : 0;
  const avgKmPerTrip = stats.totalTrips > 0 ? stats.totalKm / stats.totalTrips : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          {t("common.welcome")}{" "}
          <span className="text-primary">{user?.fullName}</span>!
        </h1>
        <Button
          className="w-full sm:w-auto" // Button takes full width on mobile
          variant={isOnline ? "danger" : "success"}
          onClick={handleToggleOnline}
          isLoading={isLoading}
        >
          {isOnline ? t("driver.goOffline") : t("driver.goOnline")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label={t("driver.totalTrips")}
          value={stats.totalTrips}
          icon={<FiMapPin />}
          trend="up"
          trendValue={`${stats.tripsThisWeek} ${t("common.thisWeek")}`}
        />
        <StatsCard
          label={t("driver.totalEarnings")}
          value={`${stats.earnings.toLocaleString()} XOF`}
          icon={<FiDollarSign />}
          trend="up"
          trendValue="Overall"
        />
        <StatsCard
          label={t("driver.rating")}
          value={stats.rating.toFixed(1)}
          icon={<FiStar />}
          trend="up"
          trendValue="Average"
        />
        <StatsCard
          label={t("driver.totalKm")}
          value={`${stats.totalKm.toFixed(1)} km`}
          icon={<FiTrendingUp />}
          trend="up"
          trendValue={t("driver.totalKmCovered")}
        />
        <StatsCard
          label={t("driver.averagePerTrip")}
          value={`${avgEarningPerTrip.toFixed(0)} XOF`}
          icon={<FiDollarSign />}
          trend="up"
          trendValue="Average"
        />
        <StatsCard
          label={t("driver.avgKmPerTrip")}
          value={`${avgKmPerTrip.toFixed(1)} km`}
          icon={<FiMapPin />}
          trend="up"
          trendValue="Average"
        />
        <StatsCard
          label={t("driver.tripsThisWeek")}
          value={stats.tripsThisWeek}
          icon={<FiTrendingUp />}
          trend="up"
          trendValue="This Week"
        />
        <StatsCard
          label={t("driver.earningsThisWeek")}
          value={`${stats.earningsThisWeek.toLocaleString()} XOF`}
          icon={<FiDollarSign />}
          trend="up"
          trendValue="This Week"
        />
      </div>

      {isOnline && (
        <Card className="cursor-pointer">
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
                <div
                  key={req.request_id}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div
                    className="flex justify-between items-start mb-4"
                    onClick={() =>
                      router.push(
                        `/${locale}/driver/requests/${req.request_id}`,
                      )
                    }
                  >
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <FiMapPin size={16} className="text-primary" />
                        {req.pickup_address}
                      </h3>
                      <p className="text-sm text-gray-600 ml-6">
                        → {req.destination_address}
                      </p>
                    </div>
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
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleAccept(req.request_id);
                        }}
                        isLoading={isLoading}
                      >
                        {t("driver.accept")}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleReject(req.request_id);
                        }}
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
