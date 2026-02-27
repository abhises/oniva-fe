"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RideTypeSelector } from "@/components/booking/RideTypeSelector";
import { PassengerSelector } from "@/components/booking/PassengerSelector";
import { PaymentSelector } from "@/components/booking/PaymentSelector";
import { FareEstimate } from "@/components/booking/FareEstimate";
import toast from "react-hot-toast";
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

// Dynamically import LocationPicker and the New Map (No SSR to prevent Leaflet errors)
const LocationPicker = dynamic(
  () => import("@/components/booking/LocationPicker").then((mod) => mod.LocationPicker),
  { ssr: false }
);

const UnifiedRouteMap = dynamic(
  () => import("@/components/booking/UnifiedRouteMap"),
  { ssr: false }
);

interface BookingFormData {
  pickupLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoffLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  date: string;
  time: string;
  bookingType: "point-to-point" | "hourly";
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
  const [bookingStep, setBookingStep] = useState<
    "details" | "confirmation" | "success"
  >("details");
  
  // State for the blue route line on the map
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    pickupLocation: {
      address: "",
      latitude: 0,
      longitude: 0,
    },
    dropoffLocation: {
      address: "",
      latitude: 0,
      longitude: 0,
    },
    date: "",
    time: "",
    bookingType: "point-to-point",
    passengers: 1,
    specialRequests: "",
    paymentMethod: "card",
    promoCode: "",
    termsAccepted: false,
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pickupLocation.address.trim()) {
      newErrors.pickup = "Pickup location is required";
    }
    if (!formData.dropoffLocation.address.trim()) {
      newErrors.dropoff = "Dropoff location is required";
    }
    if (!formData.date) {
      newErrors.date = "Date is required";
    }
    if (!formData.time) {
      newErrors.time = "Time is required";
    }
    if (formData.passengers < 1) {
      newErrors.passengers = "At least 1 passenger is required";
    }
    if (!formData.termsAccepted) {
      newErrors.terms = "You must accept terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEstimateFare = async () => {
    if (!formData.pickupLocation.latitude || !formData.dropoffLocation.latitude) {
      toast.error("Please select valid locations from the dropdown");
      return;
    }

    try {
      setIsEstimating(true);

      // 1. Fetch the base URL from your .env file
      // Adding a fallback to localhost is a good safety measure
      const osrmBaseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "http://localhost:5001";

      const coordinates = `${formData.pickupLocation.longitude},${formData.pickupLocation.latitude};${formData.dropoffLocation.longitude},${formData.dropoffLocation.latitude}`;
      
      // 2. Inject the base URL dynamically into the fetch URL
      const url = `${osrmBaseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
      
      const res = await fetch(url);
      const data = await res.json();

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error("Could not find a valid driving route for these locations.");
      }

      const route = data.routes[0];
      
      // Save the geometry to draw the blue line on the map
      setRouteGeometry(route.geometry.coordinates);

      // Convert OSRM raw data (meters/seconds) to KM/Minutes
      const distanceKm = Number((route.distance / 1000).toFixed(2));
      const durationMins = Math.ceil(route.duration / 60);

      // Pricing Logic (Adjust baseFare, perKmRate, perMinRate as needed)
      const baseFare = 3000;
      const perKmRate = 300;
      const perMinRate = 25;
      
      const distanceFee = parseFloat((distanceKm * perKmRate).toFixed(2));
      const timeFee = parseFloat((durationMins * perMinRate).toFixed(2));
      const estimatedFare = baseFare + distanceFee + timeFee;

      setFareEstimate({
        estimatedFare: estimatedFare,
        estimatedDistance: distanceKm,
        estimatedDuration: durationMins,
        baseFare: baseFare,
        distanceFee: distanceFee,
        timeFee: timeFee,
        serviceFee: 1.5, // Fixed service fee
        surgeFee: 0,
        minFare: estimatedFare * 0.9,
        maxFare: estimatedFare * 1.1,
      });

      toast.success("Fare estimated successfully!");
    } catch (error: any) {
      console.error("Fare estimation error:", error);
      toast.error(error.message || "Failed to estimate fare");
    } finally {
      setIsEstimating(false);
    }
  };
  const handlePickupChange = (location: any) => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: location,
    }));
    setRouteGeometry(null); // Clear line if location changes
    setFareEstimate(null); // Clear estimate if location changes
    if (errors.pickup) {
      setErrors((prev) => ({ ...prev, pickup: "" }));
    }
  };

  const handleDropoffChange = (location: any) => {
    setFormData((prev) => ({
      ...prev,
      dropoffLocation: location,
    }));
    setRouteGeometry(null); // Clear line if location changes
    setFareEstimate(null); // Clear estimate if location changes
    if (errors.dropoff) {
      setErrors((prev) => ({ ...prev, dropoff: "" }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const inputValue = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : value;

    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleProceedToConfirmation = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!fareEstimate) {
      toast.error("Please get a fare estimate first");
      return;
    }

    setBookingStep("confirmation");
  };

  const handleConfirmBooking = async () => {
    try {
      setIsLoading(true);

      const result = await request(() =>
        apiClient.bookTrip({
          bookingType: formData.bookingType,

          pickupLat: formData.pickupLocation.latitude,
          pickupLng: formData.pickupLocation.longitude,
          pickupAddress: formData.pickupLocation.address,

          destinationLat:
            formData.bookingType === "point-to-point"
              ? formData.dropoffLocation.latitude
              : null,

          destinationLng:
            formData.bookingType === "point-to-point"
              ? formData.dropoffLocation.longitude
              : null,

          destinationAddress:
            formData.bookingType === "point-to-point"
              ? formData.dropoffLocation.address
              : null,

          scheduledTime: `${formData.date}T${formData.time}`,

          distance: Number(Math.round(fareEstimate?.estimatedDistance || 0)),
          duration: Number(Math.round(fareEstimate?.estimatedDuration || 0)),
          basePrice: Number(Math.round(fareEstimate?.baseFare || 0)),
          totalPrice: Number(Math.round(fareEstimate?.estimatedFare || 0)),

          paymentMethod: formData.paymentMethod,
          region: "Dakar",
        })
      );

      if (!result) {
        throw new Error("Failed to book trip");
      }

      toast.success("Booking confirmed!");
      setBookingStep("success");

      setTimeout(() => {
        router.push(`/${locale}/client/client-trips`);
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Failed to book trip");
    } finally {
      setIsLoading(false);
    }
  };

  if (bookingStep === "success") {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h1>
              <p className="text-gray-600 mb-4">
                Your ride has been successfully booked
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Pickup:</span>{" "}
                  {formData.pickupLocation.address}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Dropoff:</span>{" "}
                  {formData.dropoffLocation.address}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Time:</span> {formData.date}{" "}
                  at {formData.time}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Fare:</span> $
                  {fareEstimate?.estimatedFare?.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">
              Redirecting to trips in 3 seconds...
            </p>

            <button
              onClick={() => router.push(`/${locale}/client/client-trips`)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              View Trip Details
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (bookingStep === "confirmation") {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-blue-600 text-white p-6">
                <h1 className="text-2xl font-bold">Confirm Your Booking</h1>
                <p className="text-blue-100 mt-2">
                  Review details before confirming
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Pickup Location */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <FiMapPin className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Pickup Location
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {formData.pickupLocation.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropoff Location */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <FiMapPin className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Dropoff Location
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {formData.dropoffLocation.address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <FiClock className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Date & Time
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {new Date(formData.date).toLocaleDateString()} at{" "}
                        {formData.time}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ride Type */}
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Booking Type
                  </p>
                  <p className="text-gray-900 font-semibold capitalize">
                    {formData.bookingType}
                  </p>
                </div>

                {/* Passengers */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <FiUsers className="w-5 h-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Passengers
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {formData.passengers} passenger(s)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <FiDollarSign className="w-5 h-5 text-orange-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600 font-medium">
                        Payment Method
                      </p>
                      <p className="text-gray-900 font-semibold capitalize">
                        {formData.paymentMethod}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fare Estimate */}
                {fareEstimate && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <FiDollarSign className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 font-medium">
                          Estimated Fare
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${fareEstimate.estimatedFare?.toFixed(2)}
                        </p>
                        {fareEstimate.estimatedDuration && (
                          <p className="text-xs text-gray-600 mt-1">
                            Estimated duration: {fareEstimate.estimatedDuration}{" "}
                            mins
                          </p>
                        )}
                        {fareEstimate.estimatedDistance && (
                          <p className="text-xs text-gray-600">
                            Distance: {fareEstimate.estimatedDistance} km
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                {formData.specialRequests && (
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-600 font-medium mb-2">
                      Special Requests
                    </p>
                    <p className="text-gray-900">{formData.specialRequests}</p>
                  </div>
                )}

                {/* Promo Code */}
                {formData.promoCode && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-start">
                      <FiTag className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">
                          Promo Code
                        </p>
                        <p className="text-gray-900 font-semibold">
                          {formData.promoCode}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <button
                    onClick={() => setBookingStep("details")}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                  >
                    {isLoading ? "Confirming..." : "Confirm Booking"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Book Your Trip
            </h1>
            <p className="text-gray-600">Fill in your details to book a ride</p>
          </div>

          {/* Main Form */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 space-y-6">
                  
                  {/* SINGLE UNIFIED MAP AT THE TOP */}
                  <UnifiedRouteMap 
                    pickup={formData.pickupLocation.latitude ? formData.pickupLocation : null} 
                    dropoff={formData.dropoffLocation.latitude ? formData.dropoffLocation : null} 
                    routeGeometry={routeGeometry} 
                  />

                  {/* Pickup Location */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                      <FiMapPin className="w-5 h-5 text-blue-600 mr-2" />
                      Pickup Location
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <LocationPicker
                      value={formData.pickupLocation}
                      onChange={handlePickupChange}
                      placeholder="Enter pickup location"
                      error={errors.pickup}
                    />
                    {errors.pickup && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.pickup}
                      </p>
                    )}
                  </div>

                  {/* Dropoff Location */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                      <FiMapPin className="w-5 h-5 text-red-600 mr-2" />
                      Dropoff Location
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <LocationPicker
                      value={formData.dropoffLocation}
                      onChange={handleDropoffChange}
                      placeholder="Enter dropoff location"
                      error={errors.dropoff}
                    />
                    {errors.dropoff && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.dropoff}
                      </p>
                    )}
                  </div>

                  {/* Get Fare Estimate */}
                  <button
                    onClick={handleEstimateFare}
                    disabled={isEstimating || !formData.pickupLocation.latitude || !formData.dropoffLocation.latitude}
                    className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 font-medium"
                  >
                    {isEstimating ? "Estimating..." : "Get Fare Estimate & Map Route"}
                  </button>

                  {/* Date & Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.date ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.date && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.date}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.time ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors.time && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.time}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ride Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Ride Type <span className="text-red-500">*</span>
                    </label>
                    <RideTypeSelector
                      value={formData.bookingType}
                      onChange={(bookingType) =>
                        setFormData((prev) => ({ ...prev, bookingType }))
                      }
                    />
                  </div>

                  {/* Passenger Count */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Passengers <span className="text-red-500">*</span>
                    </label>
                    <PassengerSelector
                      value={formData.passengers}
                      onChange={(passengers) =>
                        setFormData((prev) => ({ ...prev, passengers }))
                      }
                      maxPassengers={6}
                    />
                    {errors.passengers && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.passengers}
                      </p>
                    )}
                  </div>

                  {/* Special Requests */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      placeholder="e.g., Extra luggage space, quiet ride, etc."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <PaymentSelector
                      value={formData.paymentMethod}
                      onChange={(method) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: method,
                        }))
                      }
                    />
                  </div>

                  {/* Promo Code */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Promo Code (Optional)
                    </label>
                    <input
                      type="text"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      placeholder="Enter promo code if you have one"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Terms & Conditions */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        name="termsAccepted"
                        checked={formData.termsAccepted}
                        onChange={handleInputChange}
                        className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        I agree to the{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                          terms and conditions
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                          privacy policy
                        </a>
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-red-500 text-sm mt-2">
                        {errors.terms}
                      </p>
                    )}
                  </div>

                  {/* Proceed Button */}
                  <button
                    onClick={handleProceedToConfirmation}
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold text-lg"
                  >
                    Proceed to Confirmation
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Fare Estimate */}
            <div className="lg:col-span-1">
              <FareEstimate
                estimate={fareEstimate}
                bookingType={formData.bookingType}
                passengers={formData.passengers}
                isLoading={isEstimating}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}