"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/common/Card";
import { StatsCard } from "@/components/common/StatsCard";
import { Loader } from "@/components/common/Loader";
import { Button } from "@/components/common/Button";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { FiDollarSign, FiTrendingUp, FiCalendar, FiFilter } from "react-icons/fi";
import { Badge } from "@/components/common/Badge";

interface EarningsData {
  totalEarnings: number;
  tripCount: number;
  averagePerTrip: number;
  weeklyEarnings: number[];
}

// Helper to format dates for the API
const formatDate = (date: Date) => date.toISOString().split("T")[0];

export default function EarningsPage() {
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showError: true });
  const [earnings, setEarnings] = useState<EarningsData | null>(null);

  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    // Add 7 days (7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      startDate: formatDate(lastWeek),
      endDate: today.toISOString().split("T")[0],
    };
  });

  const fetchEarnings = useCallback(async () => {
    const response = await request<any>(() =>
      apiClient.getEarnings({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      })
    );

    // 🚀 THE ULTIMATE DATA EXTRACTOR
    // This digs through the object to find your data whether it's wrapped in 
    // response.data.data, response.data, or just sitting right inside response.
    const actualData = response?.data?.data || response?.data || response || {};

    setEarnings({
      totalEarnings: Number(actualData.totalEarnings) || 0,
      tripCount: Number(actualData.tripCount) || 0,
      averagePerTrip: Number(actualData.averagePerTrip) || 0,
      weeklyEarnings: Array.isArray(actualData.weeklyEarnings) ? actualData.weeklyEarnings : [],
    });
    
  }, [dateRange, request]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const setQuickRange = (days: number) => {
    setDateRange({
      startDate: formatDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000)),
      endDate: formatDate(new Date()),
    });
  };

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FiDollarSign className="text-primary" />
            {t("driver.earnings")}
          </h1>

          {/* Quick Filters */}
          <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(7)}
            >
              7 {t("common.days")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickRange(30)}
            >
              30 {t("common.days")}
            </Button>
          </div>
        </div>

        {/* Date Selector Card */}
        <Card className="mb-8 border-none shadow-sm bg-primary/5">
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                {t("common.startDate")}
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                {t("common.endDate")}
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            
            <Button onClick={fetchEarnings} isLoading={isLoading} className="px-8">
              <FiFilter className="mr-2" /> {t("common.apply")}
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <div className="py-20"><Loader /></div>
        ) : earnings ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                label={t("driver.totalEarnings")}
                value={`${earnings.totalEarnings.toLocaleString()} XOF`}
                icon={<FiDollarSign />}
                trend="up"
              />
              <StatsCard
                label={t("driver.completedTrips")}
                value={earnings.tripCount.toString()}
                icon={<FiCalendar />}
              />
              <StatsCard
                label={t("driver.averagePerTrip")}
                value={`${Math.round(earnings.averagePerTrip).toLocaleString()} XOF`}
                icon={<FiTrendingUp />}
              />
            </div>

            <Card className="overflow-hidden border-none shadow-sm">
              <h2 className="text-xl font-bold mb-6 px-2">{t("common.breakdown")}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 uppercase text-xs">
                      <th className="p-4 font-bold">{t("common.period")}</th>
                      <th className="p-4 font-bold">{t("driver.earnings")}</th>
                      <th className="p-4 font-bold text-right">{t("common.status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.weeklyEarnings.length > 0 ? (
                      earnings.weeklyEarnings.map((amount, idx) => (
                        <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition">
                          <td className="p-4 font-medium text-gray-700">{t("common.week", "Week")} {idx + 1}</td>
                          <td className="p-4 font-bold text-primary">{amount.toLocaleString()} XOF</td>
                          <td className="p-4 text-right">
                            <Badge variant="success" label={t("common.paid", "Paid") as string} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-10 text-center text-gray-400">
                          {t("common.noDataAvailable")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}