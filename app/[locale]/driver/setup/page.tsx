"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DriverProfileForm } from "@/components/driver/DriverProfileForm";
import { DocumentUpload } from "@/components/driver/DocumentUpload";

import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

/* =========================
   Types
========================= */

export interface ProfileStepData {
  nationalId: string;      // The number/ID text
  drivingLicense: string;  // The license number text
  licenseExpiry: string;
  region: string;
}



interface DriverRegistrationState {
  profile: ProfileStepData | null;
  documents: any | null; // Contains URLs from Step 2
}

/* =========================
   Component
 ========================= */

export default function DriverSetupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isLoading, request } = useApi({ showSuccess: true });
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState<DriverRegistrationState>({
    profile: null,
    documents: null,
  });

  const handleProfileComplete = (data: ProfileStepData) => {
    setFormData((prev) => ({ ...prev, profile: data }));
    setStep(2);
  };

  const handleDocsComplete = async (data: any) => {
    // 1. Submit Final Payload directly
    if (!formData.profile) {
      toast.error("Profile information missing.");
      setStep(1);
      return;
    }

    const finalPayload = {
      // 1. Identification Numbers
      nationalId: formData.profile.nationalId,
      drivingLicense: formData.profile.drivingLicense,

      // 2. Document Image URLs
      nationalIdUrl: data.nationalId?.url,
      drivingLicenseUrl: data.drivingLicense?.url,
      profilePhoto: data.profilePhoto?.url,

      // 3. Region & Expiry
      licenseExpiry: formData.profile.licenseExpiry,
      region: formData.profile.region,

      // 4. Default Vehicle Details (Removed from UI)
      vehicleInfo: {
        make: "N/A",
        model: "N/A",
        year: 0,
        licensePlate: "N/A",
        color: "N/A",
      },
    };

    const result = await request(() =>
      apiClient.createDriverProfile(finalPayload)
    );

    if (result) {
      toast.success("Application submitted successfully!");
      router.push("/driver/pending");
    }
  };

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          
          {/* Progress Tracker */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t("driver.onboardingTitle", "Driver Onboarding")}
            </h1>
            <p className="text-gray-500 mb-6 font-medium">{t("driver.onboardingDesc", "Complete all steps to start earning")}</p>
            
            <div className="flex items-center justify-center space-x-4">
              {[1, 2].map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                      step >= s
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100"
                        : "bg-white border-gray-300 text-gray-400"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 2 && (
                    <div
                      className={`w-12 h-0.5 transition-colors ${step > s ? "bg-blue-600" : "bg-gray-300"}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <DriverProfileForm
                  onSuccess={handleProfileComplete}
                  isInitialSetup={true}
                  initialData={formData.profile}
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <DocumentUpload
                  onSuccess={handleDocsComplete}
                  onBack={() => setStep(1)}
                  isInitialSetup={true}
                  initialData={formData.documents}
                />
              </div>
            )}
          </div>
          
          <p className="mt-8 text-center text-xs text-gray-400">
            {t("driver.onboardingTerms", "By continuing, you agree to Oniva's Driver Terms of Service.")}
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}