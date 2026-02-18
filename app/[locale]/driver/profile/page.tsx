"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader } from "@/components/common/Loader";
import { DriverProfileForm } from "@/components/driver/DriverProfileForm";
import { DocumentUpload } from "@/components/driver/DocumentUpload";
import { VehicleInformation } from "@/components/driver/VehicleInformation";
import { BankDetails } from "@/components/driver/BankDetails";
import toast from "react-hot-toast";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";

/* =========================
   Types
========================= */

interface UploadedDocument {
  fileName: string;
  uploadedAt: string;
  verified: boolean;
}

interface DriverProfile {
  fullName: string;
  email: string;
  phone: string;
  // add other personal info fields
}

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  plateNumber: string;
  // add other vehicle fields
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  // add other bank fields
}

interface DriverProfileData {
  profile: DriverProfile;
  documents: Record<string, UploadedDocument | null>;
  vehicle: VehicleInfo;
  bankDetails: BankInfo;
}

/* =========================
   Component
========================= */

export default function DriverProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showSuccess: true });
  const [activeTab, setActiveTab] = useState<
    "profile" | "documents" | "vehicle" | "bank"
  >("profile");
  const [profileData, setProfileData] = useState<DriverProfileData | null>(
    null,
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);

      const result = await request<DriverProfileData>(() =>
        apiClient.getDriverProfile(),
      );

      if (result) {
        setProfileData(result);
      }
    } catch (error: unknown) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <ProtectedRoute allowedRoles={["driver"]}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Driver Profile
            </h1>
            <p className="text-gray-600">
              Manage your profile, documents, vehicle, and payment information
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-x-auto">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-700 hover:text-gray-900"
                }`}
              >
                Personal Info
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition ${
                  activeTab === "documents"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-700 hover:text-gray-900"
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => setActiveTab("vehicle")}
                className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition ${
                  activeTab === "vehicle"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-700 hover:text-gray-900"
                }`}
              >
                Vehicle
              </button>
              <button
                onClick={() => setActiveTab("bank")}
                className={`px-6 py-4 font-medium text-sm border-b-2 whitespace-nowrap transition ${
                  activeTab === "bank"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-700 hover:text-gray-900"
                }`}
              >
                Bank Details
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {activeTab === "profile" && profileData && (
              <DriverProfileForm
                initialData={profileData.profile}
                onSuccess={loadProfile}
              />
            )}

            {activeTab === "documents" && profileData && (
              <DocumentUpload
                initialData={profileData.documents}
                onSuccess={loadProfile}
              />
            )}

            {activeTab === "vehicle" && profileData && (
              <VehicleInformation
                initialData={profileData.vehicle}
                onSuccess={loadProfile}
              />
            )}

            {activeTab === "bank" && profileData && (
              <BankDetails
                initialData={profileData.bankDetails}
                onSuccess={loadProfile}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
