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
  FiUser,
  FiPhone,
  FiMail,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiMapPin,
  FiCheck,
  FiX,
  FiTruck,
  FiClock,
  FiEye
} from "react-icons/fi";

export default function AdminDriverDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = params?.driverId as string;
  const { t } = useLocale();

  const [driverData, setDriverData] = useState<any>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDriverData = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getAdminDriverDetails(driverId) as any;
      if (response && response.success && response.data) {
        setDriverData(response.data.driver);
        setRecentTrips(response.data.recentTrips || []);
      } else {
        toast.error(t("admin.failedLoadUsers"));
        router.back();
      }
    } catch (error) {
      toast.error(t("admin.failedLoadUsers"));
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) {
      fetchDriverData();
    }
  }, [driverId, t, router]);

  const handleApprove = async () => {
    try {
      if (!driverData) return;
      await apiClient.approveDriver(driverData.id);
      toast.success(t("admin.DRIVER_APPROVED"));
      fetchDriverData();
    } catch (e) {
      toast.error("Failed to approve driver");
    }
  };

  const handleReject = async () => {
    try {
      if (!driverData) return;
      await apiClient.rejectDriver(driverData.id, "Documents failed verification");
      toast.success(t("admin.DRIVER_REJECTED"));
      fetchDriverData();
    } catch (e) {
      toast.error("Failed to reject driver");
    }
  };

  const handleSuspend = async () => {
    try {
      if (!driverData) return;
      await apiClient.suspendUser(driverId, "Admin suspension from dashboard");
      fetchDriverData();
    } catch (e) {
      toast.error("Failed to suspend user");
    }
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"><FiCheckCircle className="mr-1" /> {t("common.approved")}</span>;
      case "rejected":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"><FiXCircle className="mr-1" /> {t("common.rejected")}</span>;
      case "pending":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"><FiClock className="mr-1" /> {t("common.pending")}</span>;
      case "suspended":
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"><FiAlertCircle className="mr-1" /> {t("admin.suspended")}</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-800">{status}</span>;
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

  if (!driverData) return null;

  const vehicleInfo = typeof driverData.vehicle_info === 'string' ? JSON.parse(driverData.vehicle_info || '{}') : (driverData.vehicle_info || {});

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <FiArrowLeft className="w-4 h-4 mr-2" />
                {t("common.back")}
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                {driverData.full_name}
                {getVerificationBadge(driverData.verification_status)}
              </h1>
            </div>
            <div className="flex gap-2">
              {driverData.verification_status !== "approved" && (
                <Button variant="success" onClick={handleApprove}>
                  <FiCheck className="mr-2" /> {t("admin.approve")}
                </Button>
              )}
              {driverData.verification_status === "pending" && (
                <Button variant="danger" onClick={handleReject}>
                  <FiX className="mr-2" /> {t("admin.reject")}
                </Button>
              )}
              {driverData.status === "active" && driverData.verification_status === "approved" && (
                <Button variant="danger" onClick={handleSuspend}>
                  <FiAlertCircle className="mr-2" /> {t("admin.suspend")}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Profile and Vehicle */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col items-center">
                  <img
                    src={driverData.profile_photo || "/default-avatar.png"}
                    alt="Driver Photo"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-sm mb-4"
                  />
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{driverData.full_name}</h2>
                  <p className="text-sm font-medium text-gray-500 mb-4 uppercase flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${driverData.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {driverData.is_online ? t("admin.online") : t("admin.offline")}
                  </p>
                </div>
                
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><FiPhone /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">{t("auth.phone")}</p>
                      <p className="font-medium text-gray-900">{driverData.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><FiMail /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">{t("driverProfile.emailAddress", "Email")}</p>
                      <p className="font-medium text-gray-900">{driverData.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><FiMapPin /></div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">{t("driverProfile.operatingRegion", "Region")}</p>
                      <p className="font-medium text-gray-900 capitalize">{driverData.region || "Global"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTruck className="text-blue-500" /> {t("driverProfile.vehicleInfo", "Vehicle Information")}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 uppercase">{t("driverProfile.vehicleMake", "Make")}</span>
                    <span className="font-medium text-gray-900">{vehicleInfo.make || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 uppercase">{t("driverProfile.vehicleModel", "Model")}</span>
                    <span className="font-medium text-gray-900">{vehicleInfo.model || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 uppercase">{t("driverProfile.year", "Year")}</span>
                    <span className="font-medium text-gray-900">{vehicleInfo.year || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 uppercase">{t("driverProfile.color", "Color")}</span>
                    <span className="font-medium text-gray-900">{vehicleInfo.color || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500 uppercase">{t("driverProfile.plateNumber", "License Plate")}</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 rounded">{vehicleInfo.licensePlate || "N/A"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Documents and Recent Trips */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Documents Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiFileText className="text-blue-500" /> {t("driverProfile.verificationDocs", "Verification Documents")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* National ID UI */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-sm font-bold text-gray-900 mb-1">{t("driverProfile.nationalIdCard", "National ID")}</p>
                    <p className="text-xs text-gray-500 font-mono mb-3 uppercase">NO: {driverData.national_id}</p>
                    {driverData.national_id_url ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-200">
                        <img 
                          src={driverData.national_id_url} 
                          alt="National ID Preview" 
                          className="object-cover w-full h-full hover:scale-105 transition-transform" 
                          onClick={() => window.open(driverData.national_id_url, "_blank")}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        <p className="text-gray-400 text-sm">{t("driverProfile.noImageAvailable", "No image uploaded")}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Driving License UI */}
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <p className="text-sm font-bold text-gray-900 mb-1">{t("driverProfile.drivingLicense", "Driving License")}</p>
                    <p className="text-xs text-gray-500 font-mono mb-3 uppercase">NO: {driverData.driving_license}</p>
                    {driverData.driving_license_url ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-gray-200">
                        <img 
                          src={driverData.driving_license_url} 
                          alt="Driving License Preview" 
                          className="object-cover w-full h-full hover:scale-105 transition-transform" 
                          onClick={() => window.open(driverData.driving_license_url, "_blank")}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        <p className="text-gray-400 text-sm">{t("driverProfile.noImageAvailable", "No image uploaded")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Trips Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiCheckCircle className="text-blue-500" /> {t("common.recentActivity", "Recent Trips")}
                  </h3>
                  <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                    {t("admin.total", "Total")}: {driverData.total_trips}
                  </span>
                </div>
                
                {recentTrips.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {t("client.noTrips", "No trips")}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 font-semibold text-gray-900 uppercase text-xs">
                        <tr>
                          <th className="px-6 py-3">{t("admin.tripId")}</th>
                          <th className="px-6 py-3">{t("admin.client")}</th>
                          <th className="px-6 py-3">{t("common.status")}</th>
                          <th className="px-6 py-3">{t("admin.fare")}</th>
                          <th className="px-6 py-3">{t("common.startDate")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recentTrips.map(trip => (
                          <tr key={trip.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-mono">#{trip.id}</td>
                            <td className="px-6 py-4 font-medium">{trip.client_name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide
                                ${trip.status === 'completed' ? 'bg-gray-800 text-white' : 
                                  trip.status === 'in_progress' ? 'bg-green-100 text-green-800' : 
                                  'bg-blue-100 text-blue-800'}`}>
                                {trip.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900">{Number(trip.total_price || 0).toLocaleString("en-US")} XOF</td>
                            <td className="px-6 py-4 text-gray-500">{new Date(trip.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
