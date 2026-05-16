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

import { useAuth } from "@/hooks/useAuth";
import { FiUser, FiFileText, FiCheckCircle } from "react-icons/fi";

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
  const { user } = useAuth();
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
    if (!formData.profile) {
      toast.error("Profile information missing.");
      setStep(1);
      return;
    }

    const finalPayload = {
      nationalId: formData.profile.nationalId,
      drivingLicense: formData.profile.drivingLicense,
      nationalIdUrl: data.nationalId?.url,
      drivingLicenseUrl: data.drivingLicense?.url,
      profilePhoto: data.profilePhoto?.url,
      licenseExpiry: formData.profile.licenseExpiry,
      region: formData.profile.region,
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
      <div className="min-h-screen bg-gray-50 pb-20">
        
        {/* Profile-style Header */}
        <div className="bg-white border-b border-gray-200 pt-12 pb-8 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border-4 border-white shadow-md text-blue-600">
               <FiUser size={32} />
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {t("driver.welcome", "Welcome")}, {user?.fullName}!
              </h1>
              <p className="text-gray-500 mt-1">
                {t("driver.setupSubtitle", "Let's get your driver profile ready for verification.")}
              </p>
            </div>
            <div className="hidden md:block">
               <span className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold">
                  <FiCheckCircle /> {t('driver.step', 'Step')} {step} / 2
               </span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-10 px-4">
          
          {/* Enhanced Progress Tracker */}
          <div className="flex items-center justify-between mb-10 max-w-md mx-auto relative">
             <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
             <div 
                className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-500"
                style={{ width: step === 1 ? '0%' : '100%' }}
             ></div>
             
             {[
               { id: 1, label: t('driverProfile.personalInfo'), icon: <FiUser /> },
               { id: 2, label: t('driverProfile.verificationDocs'), icon: <FiFileText /> }
             ].map((s) => (
               <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-4 ${
                    step >= s.id ? 'bg-blue-600 border-blue-100 text-white' : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {s.icon}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${step >= s.id ? 'text-blue-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
               </div>
             ))}
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
             <div className="p-8 md:p-12">
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                       <h2 className="text-xl font-bold text-gray-900">{t('driverProfile.personalInfo')}</h2>
                       <p className="text-gray-500 text-sm mt-1">{t('driver.personalInfoDesc', 'Provide your basic identity details.')}</p>
                    </div>
                    <DriverProfileForm
                      onSuccess={handleProfileComplete}
                      isInitialSetup={true}
                      initialData={formData.profile}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="mb-8">
                       <h2 className="text-xl font-bold text-gray-900">{t('driverProfile.verificationDocs')}</h2>
                       <p className="text-gray-500 text-sm mt-1">{t('driver.docsDesc', 'Upload clear photos of your required documents.')}</p>
                    </div>
                    <DocumentUpload
                      onSuccess={handleDocsComplete}
                      onBack={() => setStep(1)}
                      isInitialSetup={true}
                      initialData={formData.documents}
                    />
                  </div>
                )}
             </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400 px-8">
            {t("driver.onboardingTerms", "By continuing, you agree to Oniva's Driver Terms of Service and Privacy Policy.")}
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}