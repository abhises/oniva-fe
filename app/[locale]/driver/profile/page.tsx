"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader } from "@/components/common/Loader";
import { DriverProfileForm } from "@/components/driver/DriverProfileForm";
import { DocumentUpload } from "@/components/driver/DocumentUpload";
import { VehicleInformation } from "@/components/driver/VehicleInformation";
import { BankDetails } from "@/components/driver/BankDetails";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { FiEdit2, FiUser, FiTruck, FiFileText, FiCreditCard, FiCheckCircle, FiClock, FiAlertCircle } from "react-icons/fi";
import toast from "react-hot-toast";

/* =========================
   Component
========================= */

export default function DriverProfilePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { isLoading: isActionLoading, request } = useApi({ showSuccess: true });
  
  const [activeTab, setActiveTab] = useState<"profile" | "documents" | "vehicle" | "bank">("profile");
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
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${
                isEditMode ? "bg-gray-100 text-gray-700" : "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700"
              }`}
            >
              {isEditMode ? "Cancel" : <><FiEdit2 /> Edit Profile</>}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="space-y-2">
            {[
              { id: "profile", label: "Personal Info", icon: <FiUser /> },
              { id: "documents", label: "Verification Docs", icon: <FiFileText /> },
              { id: "vehicle", label: "Vehicle Info", icon: <FiTruck /> },
              { id: "bank", label: "Payout Details", icon: <FiCreditCard /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsEditMode(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                  activeTab === tab.id ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Main Display Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6">
                
                {isEditMode ? (
                  /* --- EDIT MODE --- */
                  <div className="animate-in fade-in duration-300">
                    <h2 className="text-lg font-bold mb-6 text-gray-800 border-b pb-2">Updating Information</h2>
                    {activeTab === "profile" && <DriverProfileForm initialData={profileData} onSuccess={handleUpdateSuccess} />}
                    {activeTab === "documents" && <DocumentUpload initialData={profileData} onSuccess={handleUpdateSuccess} />}
                    {activeTab === "vehicle" && <VehicleInformation initialData={profileData?.vehicle_info} onSuccess={handleUpdateSuccess} />}
                    {/* BankDetails component would go here */}
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
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between border border-gray-100">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FiFileText /></div>
                              <div>
                                 <p className="font-bold text-sm">National ID Card</p>
                                 <p className="text-[10px] text-gray-500 uppercase">Uploaded on {new Date(profileData?.created_at).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <a href={profileData?.national_id_url} target="_blank" className="text-blue-600 font-bold text-xs hover:underline">View Document</a>
                        </div>
                        {/* Repeat for other docs */}
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