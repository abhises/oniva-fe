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
import { useRouter } from "next/navigation";

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
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showSuccess: true });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [filter, setFilter] = useState("all");

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
                    <img
                      src={driver.profile_photo}
                      alt={driver.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
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
                  <p className="text-gray-600">Status</p>
                  <p className="font-semibold">
                    {driver.is_online ? "Online" : "Offline"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Rating</p>
                  <p className="font-semibold">
                    {typeof driver.rating === "number"
                      ? driver.rating.toFixed(1)
                      : Number(driver.rating || 0).toFixed(1)}{" "}
                    ⭐ ⭐
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Trips</p>
                  <p className="font-semibold">{driver.total_trips}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/en/admin/drivers/${driver.user_id}`)}
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
    </div>
  );
}
