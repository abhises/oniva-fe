"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { Loader } from "@/components/common/Loader";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { FiUser, FiCheck, FiX, FiPause, FiEye } from "react-icons/fi";
import { useRouter, useParams } from "next/navigation";

interface Driver {
  id: number;
  user_id: number;
  phone: string;
  fullName: string;
  verification_status: string;
  is_online: boolean;
  rating: number;
  total_trips: number;
  profile_photo?: string;
}

export default function AdminDriversPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "en";
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showSuccess: true });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      const result = await request<Driver[]>(() => apiClient.getAdminDrivers());
      if (result) {
        setDrivers(result);
      }
    };
    fetchDrivers();
  }, [request]);

  const filteredDrivers =
    filter === "all"
      ? drivers
      : drivers.filter((d) => d.verification_status === filter);

  const handleApprove = async (driverId: number) => {
    await request(() => apiClient.approveDriver(driverId));
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId ? { ...d, verification_status: "approved" } : d,
      ),
    );
  };

  const handleReject = async (driverId: number) => {
    await request(() => apiClient.rejectDriver(driverId, 'Documents not verified'))
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId ? { ...d, verification_status: "rejected" } : d,
      ),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("admin.drivers")}</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {t(`common.${f}`)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Loader />
      ) : (
        <div className="grid gap-6">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} hoverable>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4 flex-1">
                  {driver.profile_photo ? (
                    <div className="relative group cursor-pointer" onClick={() => setSelectedImage(driver.profile_photo || null)}>
                      <img
                        src={driver.profile_photo}
                        alt={driver.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover:scale-110 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                        <FiEye className="text-white w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-xl">
                      {driver.fullName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{driver.fullName}</h3>
                    <p className="text-sm text-gray-600">{driver.phone}</p>
                  </div>
                </div>
                <Badge
                  variant={getStatusColor(driver.verification_status)}
                  label={driver.verification_status}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="text-gray-600">{t("common.status")}</p>
                  <p className="font-semibold">
                    {driver.is_online ? t("admin.online") : t("admin.offline")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">{t("driver.rating")}</p>
                  <p className="font-semibold">
                    {typeof driver.rating === "number"
                      ? driver.rating.toFixed(1)
                      : Number(driver.rating || 0).toFixed(1)}{" "}
                    ⭐ ⭐
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">{t("admin.trips")}</p>
                  <p className="font-semibold">{driver.total_trips}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/${locale}/admin/drivers/${driver.user_id}`)}
                >
                  <FiEye size={16} /> {t("common.viewDetails")}
                </Button>
                
                {driver.verification_status === "pending" && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(driver.id)}
                      isLoading={isLoading}
                    >
                      <FiCheck size={16} /> {t("admin.approveDriver")}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(driver.id)}
                      isLoading={isLoading}
                    >
                      <FiX size={16} /> {t("admin.rejectDriver")}
                    </Button>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
      {/* Image Zoom Modal/Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-[101]"
            onClick={() => setSelectedImage(null)}
          >
            <FiX className="w-10 h-10" />
          </button>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
             <img 
               src={selectedImage} 
               alt="Zoomed" 
               className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
             />
             <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium whitespace-nowrap">
                Click anywhere outside to close
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
