"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/common/Card";
import { StatsCard } from "@/components/common/StatsCard";
import { Loader } from "@/components/common/Loader";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { FiDollarSign, FiTrendingUp, FiCalendar } from "react-icons/fi";

interface EarningsData {
  totalEarnings: number;
  tripCount: number;
  averagePerTrip: number;
  weeklyEarnings: number[];
}

interface DateRange {
  startDate: string;
  endDate: string;
}

// ✅ Safe number formatter
const formatNumber = (value?: number) =>
  typeof value === "number" ? value.toLocaleString() : "0";

export default function EarningsPage() {
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showError: true });

  const [earnings, setEarnings] = useState<EarningsData | null>(null);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const fetchEarnings = async () => {
      const result = await request<EarningsData>(() =>
        apiClient.getEarnings({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
      );

      // ✅ Normalize API response (NO undefined leaks)
      if (result) {
        setEarnings({
          totalEarnings: result.totalEarnings ?? 0,
          tripCount: result.tripCount ?? 0,
          averagePerTrip: result.averagePerTrip ?? 0,
          weeklyEarnings: Array.isArray(result.weeklyEarnings)
            ? result.weeklyEarnings
            : [],
        });
      }
    };

    fetchEarnings();
  }, [dateRange, request]);

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">
          {t("driver.earnings")}
        </h1>

        {/* Date Range Filter */}
        <Card className="mb-8">
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("common.startDate")}
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    startDate: e.target.value,
                  })
                }
                className="px-4 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("common.endDate")}
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    endDate: e.target.value,
                  })
                }
                className="px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </Card>

        {isLoading ? (
          <Loader />
        ) : earnings ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatsCard
                label={t("driver.totalEarnings")}
                value={`${formatNumber(earnings.totalEarnings)} XOF`}
                icon={<FiDollarSign />}
                trend="up"
                trendValue="12% vs last month"
              />

              <StatsCard
                label={t("driver.completedTrips")}
                value={formatNumber(earnings.tripCount)}
                icon={<FiCalendar />}
              />

              <StatsCard
                label={t("driver.averagePerTrip")}
                value={`${formatNumber(earnings.averagePerTrip)} XOF`}
                icon={<FiTrendingUp />}
              />
            </div>

            {/* Detailed Breakdown */}
            <Card>
              <h2 className="text-2xl font-bold mb-6">
                {t("common.breakdown")}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">
                        Week
                      </th>
                      <th className="text-left p-4 font-semibold">
                        Earnings
                      </th>
                      <th className="text-left p-4 font-semibold">
                        Trend
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {earnings.weeklyEarnings.map((amount, idx) => {
                      const previous =
                        earnings.weeklyEarnings[idx - 1] ?? 0;

                      return (
                        <tr
                          key={idx}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4">
                            Week {idx + 1}
                          </td>

                          <td className="p-4 font-semibold">
                            {formatNumber(amount)} XOF
                          </td>

                          <td className="p-4 text-green-600">
                            {idx > 0 && amount > previous
                              ? "↑"
                              : "→"}{" "}
                            +2.5%
                          </td>
                        </tr>
                      );
                    })}
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
