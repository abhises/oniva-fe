"use client";

import { useEffect, useState } from "react";
import { use } from "react";  // ← Add this import!
import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Loader } from "@/components/common/Loader";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import Link from "next/link";
import { FiMapPin, FiClock, FiDollarSign, FiStar } from "react-icons/fi";

interface Trip {
  id: number;
  pickup_address: string;
  destination_address: string;
  status: string;
  total_price: number;
  created_at: string;
  driver?: {
    fullName: string;
    rating: number;
  };
}

interface TripsPageProps {
  params: Promise<{ locale: string }>;  // ← Change this!
}

export default function TripsPage({ params }: TripsPageProps) {
  const { locale } = use(params);  // ← Add this!
  
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showError: true });
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const fetchTrips = async () => {
      const result = await request<Trip[]>(() => apiClient.getTrips());
      if (result) {
        setTrips(result);
      }
    };
    fetchTrips();
  }, [request]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "cancelled":
        return "danger";
      case "in_progress":
        return "info";
      default:
        return "warning";
    }
  };

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t("client.myTrips")}</h1>

        {isLoading ? (
          <Loader />
        ) : trips.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600">{t("client.noTrips")}</p>
            <Link
              href={`/${locale}/client/book-trip`}
              className="text-primary font-semibold hover:underline mt-4 inline-block"
            >
              {t("client.bookTrip")}
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <Card key={trip.id} hoverable>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FiMapPin size={16} />
                      {trip.pickup_address}
                    </h3>
                    <p className="text-sm text-gray-600 ml-6">
                      → {trip.destination_address}
                    </p>
                  </div>
                  <Badge
                    variant={getStatusColor(trip.status)}
                    label={trip.status}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <FiDollarSign size={16} />
                    {trip.total_price} XOF
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock size={16} />
                    {new Date(trip.created_at).toLocaleDateString()}
                  </div>
                  {trip.driver && (
                    <div className="flex items-center gap-2">
                      <FiStar size={16} />
                      {trip.driver.fullName}
                    </div>
                  )}
                </div>

                <Link
                  href={`/${locale}/client/client-trips/${trip.id}`}
                  className="text-primary text-sm font-semibold hover:underline block mt-4"
                >
                  {t("common.viewDetails")}
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}