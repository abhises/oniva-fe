"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader } from "@/components/common/Loader";
import { DriverProfileForm } from "@/components/driver/DriverProfileForm";
import { DocumentUpload } from "@/components/driver/DocumentUpload";
import { VehicleInformation } from "@/components/driver/VehicleInformation";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { FiEdit2, FiUser, FiTruck, FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiEye, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";


/* =========================
   Component
========================= */

export default function DriverProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { t } = useTranslation("common");
  const { isLoading: isActionLoading, request } = useApi({ showSuccess: true });
  
  const [activeTab, setActiveTab] = useState<"profile" | "documents">("profile");
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true);
      const result = await request<any>(() => apiClient.getDriverProfile());
      if (result) setProfileData(result);
    } catch (error) {
      toast.error("Failed to fetch profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdateSuccess = () => {
    setIsEditMode(false);
    loadProfile();
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader /></div>
    );
  }

  // Helper for Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    const config: any = {
      approved: { color: "bg-green-100 text-green-700", icon: <FiCheckCircle />, label: t('common.approved') },
      pending: { color: "bg-yellow-100 text-yellow-700", icon: <FiClock />, label: t('common.pending') },
      rejected: { color: "bg-red-100 text-red-700", icon: <FiAlertCircle />, label: t('common.rejected') },
    };
    const s = config[status] || config.pending;
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${s.color}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const DataRow = ({ label, value }: { label: string, value: string | number }) => (
    <div className="py-3 border-b border-gray-50 last:border-0">
      <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
      <p className="text-gray-900 font-medium">{value || "---"}</p>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="min-h-screen bg-gray-50 pb-20">
        
        {/* Top Profile Header */}
        <div className="bg-white border-b border-gray-200 pt-10 pb-6 px-4">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-6">
            <div 
              className="relative group cursor-zoom-in"
              onClick={() => setZoomedImage(profileData?.profile_photo || "/default-avatar.png")}
            >
              <img 
                src={profileData?.profile_photo || "/default-avatar.png"} 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-transform group-hover:scale-105"
                alt="Profile"
              />
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <FiEye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profileData?.full_name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                <StatusBadge status={profileData?.verification_status} />
                <span className="text-gray-500 text-sm flex items-center gap-1"><FiUser /> {t('driverProfile.driverId')}: #{profileData?.user_id}</span>
              </div>
            </div>
            <Button
              variant={isEditMode ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? t('driverProfile.cancel') : <><FiEdit2 /> {t('driverProfile.editProfile')}</>}
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-8 px-4 flex flex-col gap-6">
          
          {/* Horizontal Navigation */}
          <div className="flex flex-wrap gap-2 mb-2 p-1 bg-white rounded-xl border border-gray-200">
            {[
              { id: "profile", label: t('driverProfile.personalInfo'), icon: <FiUser /> },
              { id: "documents", label: t('driverProfile.verificationDocs'), icon: <FiFileText /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'ghost'}
                size="sm"
                className="flex-1 justify-center min-w-[150px]"
                onClick={() => { setActiveTab(tab.id as any); setIsEditMode(false); }}
              >
                {tab.icon} {tab.label}
              </Button>
            ))}
          </div>

          {/* Main Display Area */}
          <div className="w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                
                {isEditMode ? (
                  /* --- EDIT MODE --- */
                  <div className="animate-in fade-in duration-300">
                    <h2 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">{t('driverProfile.updatingInformation')}</h2>
                    {activeTab === "profile" && <DriverProfileForm initialData={profileData} onSuccess={handleUpdateSuccess} />}
                    {activeTab === "documents" && <DocumentUpload initialData={profileData} onSuccess={handleUpdateSuccess} />}
                  </div>
                ) : (
                  /* --- VIEW MODE --- */
                  <div className="animate-in slide-in-from-bottom-2 duration-300">
                    {activeTab === "profile" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                        <DataRow label={t('driverProfile.fullName')} value={profileData?.full_name} />
                        <DataRow label={t('driverProfile.phoneNumber')} value={profileData?.phone} />
                        <DataRow label={t('driverProfile.emailAddress')} value={profileData?.email} />
                        <DataRow label={t('driverProfile.operatingRegion')} value={profileData?.region} />
                        <DataRow label={t('driverProfile.nationalIdNumber')} value={profileData?.national_id} />
                        <DataRow label={t('driverProfile.licenseNumber')} value={profileData?.driving_license} />
                      </div>
                    )}

                    {activeTab === "documents" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* National ID Card */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiFileText /></div>
                                <div>
                                   <p className="font-bold text-sm">{t('driverProfile.nationalIdCard')}</p>
                                   <p className="text-[10px] text-gray-500 uppercase">{t('driverProfile.uploadedOn')} {new Date(profileData?.created_at).toLocaleDateString()}</p>
                                </div>
                             </div>
                           </div>
                           {profileData?.national_id_url ? (
                             <div 
                              className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-300 group cursor-zoom-in"
                              onClick={() => setZoomedImage(profileData.national_id_url)}
                             >
                               <img src={profileData.national_id_url} alt="National ID" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <FiEye className="text-white w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                             </div>
                           ) : (
                             <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                               <span className="text-xs font-medium text-gray-400">{t('driverProfile.noImageAvailable')}</span>
                             </div>
                           )}
                        </div>

                        {/* Driving License */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiFileText /></div>
                                <div>
                                   <p className="font-bold text-sm">{t('driverProfile.drivingLicense')}</p>
                                   <p className="text-[10px] text-gray-500 uppercase">{t('driverProfile.uploadedOn')} {new Date(profileData?.created_at).toLocaleDateString()}</p>
                                </div>
                             </div>
                           </div>
                           {profileData?.driving_license_url ? (
                             <div 
                              className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-300 group cursor-zoom-in"
                              onClick={() => setZoomedImage(profileData.driving_license_url)}
                             >
                               <img src={profileData.driving_license_url} alt="Driving License" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <FiEye className="text-white w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                             </div>
                           ) : (
                             <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                               <span className="text-xs font-medium text-gray-400">{t('driverProfile.noImageAvailable')}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Modal */}
        {zoomedImage && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 cursor-zoom-out animate-in fade-in duration-300"
            onClick={() => setZoomedImage(null)}
          >
            <button className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full">
              <FiX className="w-8 h-8" />
            </button>
            <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center">
              <img 
                src={zoomedImage} 
                alt="Zoomed document" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}