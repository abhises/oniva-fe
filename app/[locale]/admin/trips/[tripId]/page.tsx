"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useLocale } from "@/hooks/useLocale";
import { apiClient } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { Loader } from "@/components/common/Loader";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiUser,
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiStar,
  FiCreditCard
} from "react-icons/fi";

export default function AdminTripDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string;
  const { t } = useLocale();

  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use fetch raw to avoid losing wrapper or casting correctly
  useEffect(() => {
    if (!tripId) return;

    const fetchTrip = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.getAdminTripDetails(tripId) as any;
        if (response && response.success && response.data) {
          setTrip(response.data);
        } else {
          toast.error(t("admin.failedLoadTrips"));
          router.back();
        }
      } catch (error) {
        toast.error(t("admin.failedLoadTrips"));
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrip();
  }, [tripId, router, t]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return { label: t("admin.scheduled"), color: "bg-purple-100 text-purple-800" };
      case "accepted":
      case "waiting_for_pickup":
        return { label: t("admin.assigned"), color: "bg-blue-100 text-blue-800" };
      case "in_progress":
        return { label: t("admin.inProgress"), color: "bg-green-100 text-green-800" };
      case "completed":
        return { label: t("common.completed"), color: "bg-gray-800 text-white" };
      case "cancelled":
        return { label: t("client.tripCancelled"), color: "bg-red-100 text-red-800" };
      default:
        return { label: status.toUpperCase(), color: "bg-gray-200 text-gray-800" };
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
          <Loader />
        </div>
      </ProtectedRoute>
    );
  }

  if (!trip) return null;

  const statusInfo = getStatusInfo(trip.status);

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <FiArrowLeft className="w-4 h-4 mr-2" />
                {t("common.back")}
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("client.tripDetails")} #{trip.id}
              </h1>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold tracking-wide uppercase shadow-sm ${statusInfo.color}`}>
              {statusInfo.label}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Route Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiMapPin className="text-blue-500" /> {t("admin.route")}
              </h2>
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[11px] top-6 bottom-6 w-0.5 bg-gray-200" />
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow" />
                  <p className="text-xs text-gray-500 font-semibold uppercase">{t("client.pickupLocation")}</p>
                  <p className="font-medium text-gray-900 mt-1">{trip.pickup_address}</p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow" />
                  <p className="text-xs text-gray-500 font-semibold uppercase">{t("client.destination")}</p>
                  <p className="font-medium text-gray-900 mt-1">{trip.destination_address}</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1 flex items-center gap-1"><FiCalendar /> {t("common.startDate")}</p>
                  <p className="font-medium">{new Date(trip.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1 flex items-center gap-1"><FiClock /> {t("admin.duration")}</p>
                  <p className="font-medium">{trip.actual_duration || trip.estimated_duration} min</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1 flex items-center gap-1"><FiMapPin /> {t("admin.distance")}</p>
                  <p className="font-medium">{trip.actual_distance || trip.estimated_distance} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase mb-1 flex items-center gap-1"><FiCreditCard /> Method</p>
                  <p className="font-medium capitalize">{trip.payment_method}</p>
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiUser className="text-blue-500" /> {t("admin.client")}
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t("auth.fullName")}</p>
                  <p className="font-medium text-gray-900">{trip.client_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">{t("auth.phone")}</p>
                  <p className="font-medium text-gray-900">{trip.client_phone || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiTruck className="text-green-500" /> {t("admin.driver")}
              </h2>
              {trip.driver_id ? (
                <div className="flex items-start gap-4">
                  <img
                    src={trip.driver_photo || "/default-avatar.png"}
                    alt="Driver"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm"
                  />
                  <div className="space-y-1 flex-1">
                    <p className="font-medium text-gray-900 text-lg leading-none">{trip.driver_name}</p>
                    <p className="text-sm text-gray-600">{trip.driver_phone}</p>
                    <p className="text-sm font-semibold flex items-center gap-1 text-yellow-600">
                      {Number(trip.driver_avg_rating || 0).toFixed(1)} <FiStar className="fill-current" />
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 font-medium">
                  {t("admin.waiting")}
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiDollarSign className="text-green-600" /> {t("common.breakdown")}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 font-semibold uppercase">{t("client.estimatedFare")}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${Number(trip.base_price || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold uppercase">{t("admin.platformCommission")}</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">${Number(trip.platform_commission || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-xs text-green-600 font-semibold uppercase">{t("admin.driverEarnings")}</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">${Number(trip.driver_earnings || 0).toFixed(2)}</p>
                </div>
                <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                  <p className="text-xs text-gray-400 font-semibold uppercase">{t("admin.totalRevenue")}</p>
                  <p className="text-2xl font-bold text-white mt-1">${Number(trip.total_price || trip.final_price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
