"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RideTypeSelector } from "@/components/booking/RideTypeSelector";
import { PassengerSelector } from "@/components/booking/PassengerSelector";
import { PaymentSelector } from "@/components/booking/PaymentSelector";
import { FareEstimate } from "@/components/booking/FareEstimate";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import {
  FiMapPin,
  FiClock,
  FiUsers,
  FiDollarSign,
  FiTag,
  FiCheck,
} from "react-icons/fi";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(
  () => import("@/components/booking/LocationPicker").then((mod) => mod.LocationPicker),
  { ssr: false },
);

const UnifiedRouteMap = dynamic(
  () => import("@/components/booking/UnifiedRouteMap"),
  { ssr: false },
);

// 1. ADDED INTERFACE TO FIX TS(2339) ERROR
interface PricingConfig {
  base_fare: number;
  per_km_rate: number;
  minimum_fare: number;
  long_distance_threshold_km: number;
  long_distance_coefficient: number;
  night_start_hour: number;
  night_end_hour: number;
  night_surcharge_percentage: number;
  hourly_rates: Record<string, number>;
}

interface BookingFormData {
  pickupLocation: { address: string; latitude: number; longitude: number; };
  dropoffLocation: { address: string; latitude: number; longitude: number; };
  date: string;
  time: string;
  bookingType: "point-to-point" | "hourly";
  hourlyDuration: number;
  passengers: number;
  specialRequests: string;
  paymentMethod: "card" | "cash" | "wallet";
  promoCode: string;
  termsAccepted: boolean;
}

export default function BookTripPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { user } = useAuth();
  const { t } = useTranslation();
  const { request } = useApi();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fareEstimate, setFareEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [bookingStep, setBookingStep] = useState<"details" | "confirmation" | "success">("details");
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    pickupLocation: { address: "", latitude: 0, longitude: 0 },
    dropoffLocation: { address: "", latitude: 0, longitude: 0 },
    date: "",
    time: "",
    bookingType: "point-to-point",
    hourlyDuration: 1, 
    passengers: 1,
    specialRequests: "",
    paymentMethod: "card",
    promoCode: "",
    termsAccepted: false,
  });

  // 2. TYPED THE STATE TO FIX TS(2339)
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(null);

  useEffect(() => {
    const fetchPricing = async () => {
      const result = await request<PricingConfig>(() => apiClient.getActivePrice());
      if (result) {
        setPricingConfig(result);
        if (result.hourly_rates) {
            const firstHourKey = Object.keys(result.hourly_rates)[0];
            setFormData(prev => ({...prev, hourlyDuration: Number(firstHourKey)}));
        }
      }
    };
    fetchPricing();
  }, [request]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.pickupLocation.address.trim()) newErrors.pickup = "Required";
    if (formData.bookingType === "point-to-point" && !formData.dropoffLocation.address.trim()) newErrors.dropoff = "Required";
    if (!formData.date) newErrors.date = "Required";
    if (!formData.time) newErrors.time = "Required";
    if (!formData.termsAccepted) newErrors.terms = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEstimateFare = async () => {
    if (!formData.pickupLocation.latitude || (formData.bookingType === 'point-to-point' && !formData.dropoffLocation.latitude)) {
      toast.error("Please select valid locations");
      return;
    }
    if (!pricingConfig) return;

    try {
      setIsEstimating(true);
      let baseFare = 0;
      let finalFare = 0;
      let distanceKm = 0;
      let durationMins = 0;
      let distanceFee = 0;
      let timeFee = 0;
      let isLongDistance = false;

      if (formData.bookingType === "point-to-point") {
        const osrmBaseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "http://localhost:5001";
        const coords = `${formData.pickupLocation.longitude},${formData.pickupLocation.latitude};${formData.dropoffLocation.longitude},${formData.dropoffLocation.latitude}`;
        const res = await fetch(`${osrmBaseUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson`);
        const data = await res.json();
        
        if (data.code === "Ok") {
          const route = data.routes[0];
          setRouteGeometry(route.geometry.coordinates);
          distanceKm = route.distance / 1000;
          durationMins = Math.ceil(route.duration / 60);
          baseFare = Number(pricingConfig.base_fare);
          distanceFee = distanceKm * Number(pricingConfig.per_km_rate);
          timeFee = durationMins * 25;
          finalFare = baseFare + distanceFee + timeFee;

          isLongDistance = distanceKm > pricingConfig.long_distance_threshold_km;
          if (isLongDistance) finalFare *= Number(pricingConfig.long_distance_coefficient);
        }
      } else {
        const hourlyRates = pricingConfig.hourly_rates; 
        baseFare = hourlyRates[formData.hourlyDuration] || (5000 * formData.hourlyDuration);
        finalFare = baseFare;
      }

      const tripHour = parseInt(formData.time.split(":")[0]);
      const isNight = tripHour >= pricingConfig.night_start_hour || tripHour < pricingConfig.night_end_hour;
      let nightSurchargeAmount = isNight ? (finalFare * (Number(pricingConfig.night_surcharge_percentage) / 100)) : 0;
      finalFare += nightSurchargeAmount;

      finalFare = Math.max(finalFare, Number(pricingConfig.minimum_fare));

      setFareEstimate({
        estimatedFare: Math.round(finalFare),
        estimatedDistance: Number(distanceKm.toFixed(2)),
        estimatedDuration: durationMins,
        hourlyDuration: formData.hourlyDuration,
        baseFare: baseFare,
        distanceFee: Number(distanceFee.toFixed(2)),
        timeFee: Number(timeFee.toFixed(2)),
        nightSurcharge: Math.round(nightSurchargeAmount),
        isLongDistance: isLongDistance,
        serviceFee: 1.5,
        surgeFee: 0,
        minFare: Math.round(finalFare * 0.95),
        maxFare: Math.round(finalFare * 1.05),
      });
      toast.success("Estimate ready!");
    } catch (e) {
      toast.error("Estimation failed");
    } finally {
      setIsEstimating(false);
    }
  };

  const handlePickupChange = (location: any) => {
    setFormData((prev) => ({ ...prev, pickupLocation: location }));
    setRouteGeometry(null); setFareEstimate(null);
  };

  const handleDropoffChange = (location: any) => {
    setFormData((prev) => ({ ...prev, dropoffLocation: location }));
    setRouteGeometry(null); setFareEstimate(null);
  };

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleProceedToConfirmation = () => {
    if (validateForm() && fareEstimate) setBookingStep("confirmation");
    else toast.error("Check form and estimate");
  };

  const handleConfirmBooking = async () => {
    try {
      setIsLoading(true);
      const result = await request<any>(() => apiClient.bookTrip({
        bookingType: formData.bookingType,
        pickupLat: formData.pickupLocation.latitude,
        pickupLng: formData.pickupLocation.longitude,
        pickupAddress: formData.pickupLocation.address,
        destinationLat: formData.bookingType === "point-to-point" ? formData.dropoffLocation.latitude : null,
        destinationLng: formData.bookingType === "point-to-point" ? formData.dropoffLocation.longitude : null,
        destinationAddress: formData.bookingType === "point-to-point" ? formData.dropoffLocation.address : null,
        scheduledTime: `${formData.date}T${formData.time}`,
        distance: Math.round(fareEstimate?.estimatedDistance || 0),
        duration: formData.bookingType === 'hourly' ? formData.hourlyDuration : Math.round(fareEstimate?.estimatedDuration || 0),
        basePrice: Math.round(fareEstimate?.baseFare || 0),
        totalPrice: Math.round(fareEstimate?.estimatedFare || 0),
        paymentMethod: formData.paymentMethod,
        region: "Dakar",
      }));
      if (result?.trip) {
        toast.success("Confirmed!");
        setBookingStep("success");
        setTimeout(() => router.push(`/${locale}/client/client-trips/${result.trip.id}`), 3000);
      }
    } catch (e) { toast.error("Booking failed"); } finally { setIsLoading(false); }
  };

  if (bookingStep === "success") {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <FiCheck className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <div className="bg-gray-50 p-4 rounded text-left mb-6">
              <p className="text-sm"><strong>Pickup:</strong> {formData.pickupLocation.address}</p>
              <p className="text-sm"><strong>Total:</strong> {fareEstimate?.estimatedFare?.toLocaleString()} FCFA</p>
            </div>
            <p className="text-gray-500 text-sm mb-4">Redirecting...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (bookingStep === "confirmation") {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-blue-600 text-white p-6"><h1 className="text-2xl font-bold">Review Booking</h1></div>
            <div className="p-6 space-y-4">
              <div className="border p-4 rounded"><p className="text-xs text-gray-500">Pickup</p><p className="font-bold">{formData.pickupLocation.address}</p></div>
              {formData.bookingType === 'point-to-point' && <div className="border p-4 rounded"><p className="text-xs text-gray-500">Dropoff</p><p className="font-bold">{formData.dropoffLocation.address}</p></div>}
              <div className="border p-4 rounded"><p className="text-xs text-gray-500">Price</p><p className="text-xl font-bold text-blue-600">{fareEstimate.estimatedFare.toLocaleString()} FCFA</p></div>
              <div className="flex gap-4 pt-4 border-t">
                <Button variant="ghost" fullWidth onClick={() => setBookingStep("details")}>Back</Button>
                <Button variant="primary" fullWidth isLoading={isLoading} onClick={handleConfirmBooking}>
                  {!isLoading && 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Book Your Trip</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-lg shadow-lg">
              <UnifiedRouteMap pickup={formData.pickupLocation.latitude ? formData.pickupLocation : null} dropoff={formData.dropoffLocation.latitude ? formData.dropoffLocation : null} routeGeometry={routeGeometry} />
              
              <RideTypeSelector value={formData.bookingType} onChange={(bookingType) => setFormData((prev) => ({ ...prev, bookingType }))} />

              {formData.bookingType === 'hourly' && pricingConfig?.hourly_rates && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <label className="block text-sm font-bold text-blue-800 mb-2">Select Duration (Database Config)</label>
                  <select 
                    name="hourlyDuration" 
                    value={formData.hourlyDuration} 
                    onChange={handleInputChange} 
                    className="w-full p-2 border rounded"
                  >
                    {Object.entries(pricingConfig.hourly_rates).map(([hours, rate]) => (
                      <option key={hours} value={hours}>
                        {hours} Hour{Number(hours) > 1 ? 's' : ''} ({Number(rate).toLocaleString()} FCFA)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <LocationPicker value={formData.pickupLocation} onChange={handlePickupChange} placeholder="Pickup Location" error={errors.pickup} />
              {formData.bookingType === 'point-to-point' && <LocationPicker value={formData.dropoffLocation} onChange={handleDropoffChange} placeholder="Dropoff Location" error={errors.dropoff} />}
              
              <div className="grid grid-cols-2 gap-4">
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="p-2 border rounded" />
                <input type="time" name="time" value={formData.time} onChange={handleInputChange} className="p-2 border rounded" />
              </div>
              
              <Button
                variant="success"
                fullWidth
                isLoading={isEstimating}
                onClick={handleEstimateFare}
              >
                {!isEstimating && 'Estimate price'}
              </Button>

              <PassengerSelector value={formData.passengers} onChange={(passengers) => setFormData((prev) => ({ ...prev, passengers }))} maxPassengers={6} />
              <PaymentSelector value={formData.paymentMethod} onChange={(method) => setFormData((prev) => ({ ...prev, paymentMethod: method }))} />
              
              {/* FIXED ALIGNMENT HERE */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="termsAccepted" 
                    checked={formData.termsAccepted} 
                    onChange={handleInputChange} 
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 transition shrink-0"
                  />
                  <span className="text-sm text-gray-700 leading-tight">
                    I agree to the <a href="#" className="text-blue-600 underline">terms and conditions</a> and <a href="#" className="text-blue-600 underline">privacy policy</a>
                  </span>
                </label>
                {errors.terms && <p className="text-red-500 text-xs mt-2 ml-8">{errors.terms}</p>}
              </div>

              <Button variant="primary" fullWidth size="lg" onClick={handleProceedToConfirmation}>
                Proceed to Confirmation
              </Button>
            </div>
            <div className="lg:col-span-1">
              <FareEstimate estimate={fareEstimate} bookingType={formData.bookingType} passengers={formData.passengers} isLoading={isEstimating} />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}