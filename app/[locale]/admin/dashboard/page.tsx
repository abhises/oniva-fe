"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { StatsCard } from "@/components/common/StatsCard";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import Link from "next/link";
import {
  FiUsers,
  FiDollarSign,
  FiTrendingUp,
  FiFileText,
} from "react-icons/fi";
import { Loader } from "@/components/common/Loader";
interface AdminDashboardProps {
  params: Promise<{ locale: string }>;
}
interface DashboardStats {
  totalUsers: number;
  totalDrivers: number;
  totalEarnings: number;
  totalTrips: number;
  pendingDriverApprovals: number;
  activeTrips: number;
}
// FIX: Default stats to use when API fails or returns empty
const DEFAULT_STATS: DashboardStats = {
  totalUsers: 0,
  totalDrivers: 0,
  totalEarnings: 0,
  totalTrips: 0,
  pendingDriverApprovals: 0,
  activeTrips: 0,
};
export default function AdminDashboard({ params }: AdminDashboardProps) {
  // FIX: Use React.use() to unwrap params
  const { locale } = use(params);
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showSuccess: false });
  // FIX: Initialize with default values
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        setPageLoading(true);

        // Call API
        const result = await request<any>(() => apiClient.getAdminDashboard());
        console.log("API Response:", result);
        if (result && typeof result === "object") {
          const data = result.data || result.payload || result;

          // Convert string numbers to actual numbers
          const validatedStats: DashboardStats = {
            totalUsers: Number(data.totalusers || 0),
            totalDrivers: Number(data.total_drivers || 0),
            totalEarnings: Number(data.total_revenue || 0),
            totalTrips: Number(data.completed_trips || 0),
            pendingDriverApprovals: Number(data.pending_drivers || 0),
            activeTrips: Number(data.active_trips || 0),
          };

          setStats(validatedStats);
        } else {
          setError("Backend API returned empty data");
          setStats(DEFAULT_STATS);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        setStats(DEFAULT_STATS);
      } finally {
        setPageLoading(false);
      }
    };

    fetchStats();
  }, [request]);
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">{t("admin.dashboard")}</h1>
        {/* FIX: Show error message if present */}
        {error && (
          <Card className="mb-8 bg-red-50 border-2 border-red-200">
            <div className="text-red-700 font-semibold">❌ Backend Issue</div>
            <p className="text-red-600 text-sm mt-2">{error}</p>
            <div className="mt-3 text-xs text-red-500 bg-red-100 p-2 rounded">
              <p className="font-mono">API Endpoint: /api/admin/dashboard</p>
              <p className="font-mono">Expected Response:</p>
              <pre className="mt-1 text-xs overflow-x-auto">
                {/* {{   "totalUsers": 342,   "totalDrivers": 58,   "totalEarnings": 625000,   "totalTrips": 1250,   "pendingDriverApprovals": 5,   "activeTrips": 12 }} */}
              </pre>
            </div>
          </Card>
        )}
        {/* FIX: Show loading state */}
        {pageLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader />
          </div>
        ) : (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                label={t("admin.totalUsers")}
                value={stats.totalUsers}
                icon={<FiUsers />}
                trend="up"
                trendValue="12 new this week"
              />
              <StatsCard
                label={t("admin.totalDrivers")}
                value={stats.totalDrivers}
                icon={<FiUsers />}
                trend="up"
                trendValue="5 new this week"
              />
              {/* FIX: Format earnings as string before passing to StatsCard */}
              <StatsCard
                label={t("admin.totalEarnings")}
                value={`${(stats.totalEarnings || 0).toLocaleString("en-US")} XOF`}
                icon={<FiDollarSign />}
                trend="up"
                trendValue="15% from last month"
              />
              <StatsCard
                label={t("admin.totalTrips")}
                value={stats.totalTrips}
                icon={<FiTrendingUp />}
                trend="up"
                trendValue="250 this week"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Pending Driver Approvals */}
              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("admin.pendingApprovals")}
                    </h3>
                    <p className="text-3xl font-bold text-primary">
                      {stats.pendingDriverApprovals}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Drivers awaiting approval
                    </p>
                  </div>
                  <Badge variant="warning" label="Pending" />
                </div>
                <Link href={`/${locale}/admin/drivers`}>
                  <Button variant="primary" fullWidth className="mt-4">
                    Review Drivers
                  </Button>
                </Link>
              </Card>

              {/* Active Trips */}
              <Card>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {t("admin.activeTrips")}
                    </h3>
                    <p className="text-3xl font-bold text-success">
                      {stats.activeTrips}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Trips in progress
                    </p>
                  </div>
                  <Badge variant="success" label="Active" />
                </div>
                <Link href={`/${locale}/admin/trips`}>
                  <Button variant="secondary" fullWidth className="mt-4">
                    Monitor Trips
                  </Button>
                </Link>
              </Card>
            </div>

            {/* Admin Tools */}
            <Card>
              <h2 className="text-2xl font-bold mb-6">{t("admin.tool")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Manage Drivers */}
                <Link href={`/${locale}/admin/drivers`}>
                  <div className="p-6 border rounded-lg hover:shadow-lg cursor-pointer transition">
                    <FiUsers className="text-primary text-4xl mb-3" />
                    <h3 className="font-bold text-lg mb-2">
                      {t("admin.drivers")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Approve, reject, or suspend drivers
                    </p>
                  </div>
                </Link>

                {/* Reports & Analytics */}
                <Link href={`/${locale}/admin/reports`}>
                  <div className="p-6 border rounded-lg hover:shadow-lg cursor-pointer transition">
                    <FiFileText className="text-primary text-4xl mb-3" />
                    <h3 className="font-bold text-lg mb-2">
                      {t("admin.reports")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      View detailed reports and analytics
                    </p>
                  </div>
                </Link>

                {/* Earnings Management */}
                <Link href={`/${locale}/admin/earnings`}>
                  <div className="p-6 border rounded-lg hover:shadow-lg cursor-pointer transition">
                    <FiDollarSign className="text-primary text-4xl mb-3" />
                    <h3 className="font-bold text-lg mb-2">
                      {t("admin.earnings")}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Monitor platform earnings and commissions
                    </p>
                  </div>
                </Link>
              </div>
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
