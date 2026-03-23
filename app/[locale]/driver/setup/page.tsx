"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader } from "@/components/common/Loader";
import { DriverProfileForm } from "@/components/driver/DriverProfileForm";
import { DocumentUpload } from "@/components/driver/DocumentUpload";
import { VehicleInformation } from "@/components/driver/VehicleInformation";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import toast from "react-hot-toast";

/* =========================
   Types
========================= */

export interface ProfileStepData {
  nationalId: string;
  drivingLicense: string;
  licenseExpiry: string;
  region: string;
  profilePhoto?: string;
}

export interface VehicleStepData {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
}

interface DriverRegistrationState {
  profile: ProfileStepData | null;
  documents: any | null; 
  vehicle: VehicleStepData | null;
}

/* =========================
   Component
========================= */

export default function DriverSetupPage() {
  const router = useRouter();
  const { isLoading, request } = useApi({ showSuccess: true });
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<DriverRegistrationState>({
    profile: null,
    documents: null,
    vehicle: null,
  });

  const handleProfileComplete = (data: ProfileStepData) => {
    setFormData((prev) => ({ ...prev, profile: data }));
    setStep(2);
  };

  const handleDocsComplete = (data: any) => {
    setFormData((prev) => ({ ...prev, documents: data }));
    setStep(3);
  };

  const handleFinalSubmit = async (vehicleData: VehicleStepData) => {
    if (!formData.profile) {
      toast.error("Profile data missing. Restarting...");
      setStep(1);
      return;
    }

    const finalPayload = {
      nationalId: formData.profile.nationalId,
      drivingLicense: formData.profile.drivingLicense,
      licenseExpiry: formData.profile.licenseExpiry,
      profilePhoto: formData.profile.profilePhoto || "",
      region: formData.profile.region,
      vehicleInfo: {
        make: vehicleData.make,
        model: vehicleData.model,
        year: Number(vehicleData.year),
        licensePlate: vehicleData.licensePlate,
        color: vehicleData.color,
      }
    };

    const result = await request(() => apiClient.createDriverProfile(finalPayload));
    
    if (result) {
      router.push("/driver/pending");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Progress Tracker */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Driver Onboarding</h1>
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${
                    step >= s ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-400"
                  }`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-10 h-0.5 ${step > s ? "bg-blue-600" : "bg-gray-300"}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-8">
            {step === 1 && (
              <DriverProfileForm 
                onSuccess={handleProfileComplete} 
                isInitialSetup={true} 
              />
            )}

            {step === 2 && (
              <DocumentUpload 
                onSuccess={handleDocsComplete} 
                onBack={() => setStep(1)}
                isInitialSetup={true}
              />
            )}

            {step === 3 && (
              <VehicleInformation 
                onSuccess={handleFinalSubmit} 
                onBack={() => setStep(2)}
                isInitialSetup={true}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}