"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Card } from "@/components/common/Card";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { FiMapPin, FiClock, FiDollarSign } from "react-icons/fi";

/* -------------------- Types -------------------- */

interface FormData {
  bookingType: "point-to-point" | "hourly";
  pickupLat: string;
  pickupLng: string;
  pickupAddress: string;
  destinationLat: string;
  destinationLng: string;
  destinationAddress: string;
  distance: string;
  duration: string;
  basePrice: string;
  paymentMethod: "cash" | "card";
  region: string;
}

interface EstimatedFare {
  basePrice: number;
  platformCommission: number;
  totalPrice: number;
}

/* -------------------- Helpers -------------------- */

const toNumber = (value: string): number => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

/* -------------------- Component -------------------- */

export default function BookTripPage({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = useTranslation();
  const { isLoading, request } = useApi({ showSuccess: true });

  const [formData, setFormData] = useState<FormData>({
    bookingType: "point-to-point",
    pickupLat: "",
    pickupLng: "",
    pickupAddress: "",
    destinationLat: "",
    destinationLng: "",
    destinationAddress: "",
    distance: "",
    duration: "",
    basePrice: "",
    paymentMethod: "cash",
    region: "Dakar",
  });

  const [estimatedFare, setEstimatedFare] = useState<EstimatedFare | null>(
    null,
  );

  /* -------------------- Handlers -------------------- */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEstimate = async () => {
    if (!formData.distance) return;

    const result = await request<EstimatedFare>(() =>
      apiClient.estimateFare({
        bookingType: formData.bookingType,
        distance: toNumber(formData.distance),
        pickupTime: new Date().toISOString(),
        date: new Date().toISOString(),
      }),
    );

    if (result) {
      setEstimatedFare(result);
      setFormData((prev) => ({
        ...prev,
        basePrice: String(result.basePrice),
      }));
    }
  };

  const handleBook = async () => {
    await request(() =>
      apiClient.bookTrip({
        ...formData,
        pickupLat: toNumber(formData.pickupLat),
        pickupLng: toNumber(formData.pickupLng),
        destinationLat: toNumber(formData.destinationLat),
        destinationLng: toNumber(formData.destinationLng),
        distance: toNumber(formData.distance),
        basePrice: toNumber(formData.basePrice),
      }),
    );
  };

  /* -------------------- UI -------------------- */

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t("client.bookTrip")}</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* -------------------- Form -------------------- */}
          <Card>
            <h2 className="text-xl font-bold mb-4">
              {t("client.tripDetails")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("client.tripType")}
                </label>
                <select
                  name="bookingType"
                  value={formData.bookingType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="point-to-point">
                    {t("client.pointToPoint")}
                  </option>
                  <option value="hourly">{t("client.hourly")}</option>
                </select>
              </div>

              <Input
                label={t("client.pickupLocation")}
                name="pickupAddress"
                value={formData.pickupAddress}
                onChange={handleChange}
                placeholder="Downtown"
              />

              <Input
                label={t("client.destination")}
                name="destinationAddress"
                value={formData.destinationAddress}
                onChange={handleChange}
                placeholder="Airport"
              />

              <Input
                label={t("client.distance")}
                name="distance"
                type="number"
                value={formData.distance}
                onChange={handleChange}
                placeholder="5.2"
              />

              <Button
                variant="secondary"
                onClick={handleEstimate}
                disabled={isLoading || !formData.distance}
              >
                {t("client.estimateFare")}
              </Button>
            </div>
          </Card>

          {/* -------------------- Fare Summary -------------------- */}
          {estimatedFare && (
            <Card className="bg-gray-50">
              <h2 className="text-xl font-bold mb-4">
                {t("client.estimatedFare")}
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{t("client.basePrice")}</span>
                  <span className="font-bold">
                    {estimatedFare.basePrice} XOF
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>{t("client.platformCommission")}</span>
                  <span className="font-bold">
                    {estimatedFare.platformCommission} XOF
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between text-lg">
                  <span>{t("client.totalPrice")}</span>
                  <span className="font-bold text-primary">
                    {estimatedFare.totalPrice} XOF
                  </span>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleBook}
                  isLoading={isLoading}
                >
                  {t("client.confirmBooking")}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
