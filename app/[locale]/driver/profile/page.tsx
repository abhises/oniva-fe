"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader } from "@/components/common/Loader";
import { DriverProfileForm } from "@/components/driver/DriverProfileForm";
import { DocumentUpload } from "@/components/driver/DocumentUpload";
import { VehicleInformation } from "@/components/driver/VehicleInformation";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { FiEdit2, FiUser, FiTruck, FiFileText, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";

/* =========================
   Component
========================= */

export default function DriverProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { isLoading: isActionLoading, request } = useApi({ showSuccess: true });
  
  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "vehicle">("profile");
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

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
      approved: { color: "bg-green-100 text-green-700", icon: <FiCheckCircle />, label: "Verified" },
      pending: { color: "bg-yellow-100 text-yellow-700", icon: <FiClock />, label: "Pending Verification" },
      rejected: { color: "bg-red-100 text-red-700", icon: <FiAlertCircle />, label: "Rejected" },
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
            <div className="relative">
              <img 
                src={profileData?.profile_photo || "/default-avatar.png"} 
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                alt="Profile"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" />
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{profileData?.full_name}</h1>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                <StatusBadge status={profileData?.verification_status} />
                <span className="text-gray-500 text-sm flex items-center gap-1"><FiUser /> Driver ID: #{profileData?.user_id}</span>
              </div>
            </div>
            <Button
              variant={isEditMode ? 'ghost' : 'primary'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? 'Cancel' : <><FiEdit2 /> Edit Profile</>}
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-8 px-4 flex flex-col gap-6">
          
          {/* Horizontal Navigation */}
          <div className="flex flex-wrap gap-2 mb-2 p-1 bg-white rounded-xl border border-gray-200">
            {[
              { id: "profile", label: "Personal Info", icon: <FiUser /> },
              { id: "documents", label: "Verification Docs", icon: <FiFileText /> },
              { id: "vehicle", label: "Vehicle Info", icon: <FiTruck /> },
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
                    <h2 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">Updating Information</h2>
                    {activeTab === "profile" && <DriverProfileForm initialData={profileData} onSuccess={handleUpdateSuccess} />}
                    {activeTab === "documents" && <DocumentUpload initialData={profileData} onSuccess={handleUpdateSuccess} />}
                    {activeTab === "vehicle" && <VehicleInformation initialData={profileData?.vehicle_info} onSuccess={handleUpdateSuccess} />}
                  </div>
                ) : (
                  /* --- VIEW MODE --- */
                  <div className="animate-in slide-in-from-bottom-2 duration-300">
                    {activeTab === "profile" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                        <DataRow label="Full Name" value={profileData?.full_name} />
                        <DataRow label="Phone Number" value={profileData?.phone} />
                        <DataRow label="Email Address" value={profileData?.email} />
                        <DataRow label="Operating Region" value={profileData?.region} />
                        <DataRow label="National ID Number" value={profileData?.national_id} />
                        <DataRow label="License Number" value={profileData?.driving_license} />
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
                                   <p className="font-bold text-sm">National ID Card</p>
                                   <p className="text-[10px] text-gray-500 uppercase">Uploaded on {new Date(profileData?.created_at).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <a href={profileData?.national_id_url} target="_blank" className="text-blue-600 font-bold text-xs hover:underline">Open Full</a>
                           </div>
                           {profileData?.national_id_url ? (
                             <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                               <img src={profileData.national_id_url} alt="National ID" className="w-full h-full object-cover hover:object-contain transition-all" />
                             </div>
                           ) : (
                             <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                               <span className="text-xs font-medium text-gray-400">No image available</span>
                             </div>
                           )}
                        </div>

                        {/* Driving License */}
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiFileText /></div>
                                <div>
                                   <p className="font-bold text-sm">Driving License</p>
                                   <p className="text-[10px] text-gray-500 uppercase">Uploaded on {new Date(profileData?.created_at).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <a href={profileData?.driving_license_url} target="_blank" className="text-blue-600 font-bold text-xs hover:underline">Open Full</a>
                           </div>
                           {profileData?.driving_license_url ? (
                             <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden border border-gray-300">
                               <img src={profileData.driving_license_url} alt="Driving License" className="w-full h-full object-cover hover:object-contain transition-all" />
                             </div>
                           ) : (
                             <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border border-dashed border-gray-300">
                               <span className="text-xs font-medium text-gray-400">No image available</span>
                             </div>
                           )}
                        </div>
                      </div>
                    )}

                    {activeTab === "vehicle" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                        <DataRow label="Vehicle Make" value={profileData?.vehicle_info?.make} />
                        <DataRow label="Vehicle Model" value={profileData?.vehicle_info?.model} />
                        <DataRow label="Plate Number" value={profileData?.vehicle_info?.licensePlate} />
                        <DataRow label="Color" value={profileData?.vehicle_info?.color} />
                        <DataRow label="Year" value={profileData?.vehicle_info?.year} />
                      </div>
                    )}
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