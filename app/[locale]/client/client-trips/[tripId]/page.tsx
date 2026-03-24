"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/common/Button";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  FiArrowLeft,
  FiLoader,
  FiMapPin,
  FiClock,
  FiDollarSign,
  FiPhone,
  FiStar,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiMap,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

// Interface strictly matching your API response
interface Trip {
  id: string | number;
  status: string;
  booking_type: string;
  pickup_address: string;
  destination_address?: string | null;
  pickup_latitude?: string | number;
  pickup_longitude?: string | number;
  estimated_distance?: string | number;
  estimated_duration?: number;
  total_price?: string | number;
  base_price?: string | number;
  created_at: string;
  started_at?: string;
  completed_at?: string | null;
  cancelled_at?: string;
  cancellation_reason?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  otp_code?: string;
  driver?: {
    id: string | number;
    full_name: string;
    phone: string;
    rating?: number;
    review_count?: number;
    car?: {
      model: string;
      license_plate: string;
      color?: string;
    };
  };
  rating?: {
    rating: number;
    review?: string;
    created_at?: string;
  };
}

export default function ClientTripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string;
  const { user } = useAuth();
  const { request, isLoading: isApiLoading } = useApi({ showSuccess: true });

  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rating modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const loadTripDetails = useCallback(async (showSpinner = true) => {
    try {
      if (!tripId) return;

      if (showSpinner) {
        setIsLoading(true);
      }

      const data = await request<Trip>(async () => {
        return await apiClient.getTripDetails(tripId);
      });

      if (data) {
        setTrip(data);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }, [tripId, request]);

  useEffect(() => {
    // Initial load
    loadTripDetails(true);

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socket = io(socketUrl);

    if (user?.id) {
      socket.emit('auth', { userId: user.id, userRole: 'client' });
      socket.emit('join_trip_room', { tripId });
    }

    // 🟢 UPDATED SOCKET LISTENER 🟢
    socket.on('trip_status_changed', (data) => {
      if (String(data.tripId) === String(tripId) || String(data.trip_id) === String(tripId)) {
        if (data.status === 'cancelled') {
          toast.error("This trip has been cancelled.");
          loadTripDetails(false); 
        } else {
          console.log(`Trip status changed to: ${data.status}`);
          loadTripDetails(false); 
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tripId, user?.id, loadTripDetails]);

  const handleRateTrip = async () => {
    if (!trip) return;

    if (selectedRating < 1 || selectedRating > 5) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setIsSubmittingRating(true);

      const result = await request(async () => {
        return await apiClient.rateTrip(tripId, {
          rating: selectedRating,
          review: reviewText || undefined,
        });
      });

      if (result) {
        setTrip((prev) =>
          prev
            ? {
                ...prev,
                rating: {
                  rating: selectedRating,
                  review: reviewText,
                  created_at: new Date().toISOString(),
                },
              }
            : null,
        );
        setShowRatingModal(false);
        setSelectedRating(5);
        setReviewText("");
        toast.success("Thank you for your rating!");
      }
    } catch (error: any) {
      toast.error("Failed to submit rating");
      console.error(error);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleCancelTrip = async () => {
    if (!trip) return;

    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsCancelling(true);

      const result = await request(async () => {
        return await apiClient.cancelTrip(tripId, cancelReason);
      });

      if (result) {
        setTrip((prev) =>
          prev
            ? {
                ...prev,
                status: "cancelled",
                cancellation_reason: cancelReason,
                cancelled_at: new Date().toISOString(),
              }
            : null,
        );
        setShowCancelModal(false);
        setCancelReason("");
        toast.success("Trip cancelled successfully");
        router.push("/client/book-trip");
      }
    } catch (error: any) {
      toast.error("Failed to cancel trip");
      console.error(error);
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "started":
      case "in_progress": // Changed to match backend string
        return "bg-blue-100 text-blue-800";
      case "assigned":
      case "accepted":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
      case "scheduled":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <FiCheckCircle className="w-5 h-5" />;
      case "cancelled":
        return <FiX className="w-5 h-5" />;
      case "started":
      case "in_progress": // Changed to match backend string
        return <FiMap className="w-5 h-5" />;
      case "assigned":
      case "accepted": 
        return <FiUser className="w-5 h-5" />;
      default:
        return <FiCalendar className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading trip details...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!trip) {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <FiArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Trip Not Found
              </h1>
              <p className="text-gray-600">
                The trip you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const safeBasePrice = Number(trip.base_price || 0);
  const safeTotalPrice = Number(trip.total_price || 0);
  const safeDistanceCharge =
    safeTotalPrice > safeBasePrice ? safeTotalPrice - safeBasePrice : 0;
  const safeEstimatedDistance = Number(trip.estimated_distance || 0);

  return (
    <ProtectedRoute allowedRoles={["client"]}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <FiArrowLeft className="w-4 h-4" />
              Back to Trips
            </Button>

            <div className="flex items-center justify-between bg-white rounded-lg shadow-lg p-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Trip Details
                </h1>
                <p className="text-gray-600 mt-1">Trip ID: {trip.id}</p>
              </div>

              <span
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${getStatusColor(
                  trip.status,
                )}`}
              >
                {getStatusIcon(trip.status)}
                <span className="capitalize">{trip.status}</span>
              </span>
            </div>
          </div>
          
          {/* OTP SECTION */}
          {trip.otp_code &&
            (trip.status === "pending" ||
              trip.status === "assigned" ||
              trip.status === "accepted") && (
              <div className="bg-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white text-center">
                <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">
                  Pickup Verification Code
                </h2>
                <div className="flex justify-center gap-3">
                  {trip.otp_code.split("").map((digit, index) => (
                    <div
                      key={index}
                      className="w-12 h-14 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-3xl font-black border border-white/30"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs opacity-90">
                  Give this code to the driver upon arrival.
                </p>
              </div>
            )}

          {/* Trip Status Timeline */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FiClock className="w-5 h-5" />
              Trip Timeline
            </h2>

            <div className="space-y-4">
              {/* Booked */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                  {/* Only show line if there's a next step */}
                  {(trip.driver || trip.status === "cancelled") && (
                    <div className="w-0.5 h-12 bg-gray-300 my-1"></div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Trip Booked</p>
                  <p className="text-sm text-gray-600">
                    {new Date(trip.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Driver Assigned */}
              {trip.driver && (
                <>
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <FiCheckCircle className="w-5 h-5" />
                      </div>
                      {trip.started_at && (
                        <div className="w-0.5 h-12 bg-gray-300 my-1"></div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Driver Assigned
                      </p>
                      <p className="text-sm text-gray-600">
                        {trip.driver.full_name || trip.driver_name}
                      </p>
                    </div>
                  </div>

                  {/* Trip Started */}
                  {trip.started_at && (
                    <>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <FiCheckCircle className="w-5 h-5" />
                          </div>
                          {trip.completed_at && (
                            <div className="w-0.5 h-12 bg-gray-300 my-1"></div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Trip Started
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(trip.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Trip Completed */}
                      {trip.completed_at && (
                        <div className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                              <FiCheckCircle className="w-5 h-5" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Trip Completed
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(trip.completed_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Trip Cancelled */}
              {trip.status === "cancelled" && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                      <FiX className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Trip Cancelled
                    </p>
                    {trip.cancelled_at && (
                      <p className="text-sm text-gray-600">
                        {new Date(trip.cancelled_at).toLocaleString()}
                      </p>
                    )}
                    {trip.cancellation_reason && (
                      <p className="text-sm text-red-600 mt-1">
                        Reason: {trip.cancellation_reason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Route Information */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin className="w-5 h-5" />
              Route Information
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  PICKUP LOCATION
                </p>
                <p className="text-gray-900 font-semibold mt-1">
                  {trip.pickup_address}
                </p>
              </div>

              <div className="bg-gray-100 h-0.5"></div>

              <div>
                <p className="text-sm text-gray-500 font-medium">
                  DROPOFF LOCATION
                </p>
                <p className="text-gray-900 font-semibold mt-1">
                  {trip.destination_address || "Not Specified (Hourly Booking)"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-600 font-medium">
                    EST. DISTANCE
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {safeEstimatedDistance.toFixed(1)} km
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-600 font-medium">
                    EST. DURATION
                  </p>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {trip.estimated_duration || 0} min
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          {(trip.driver || trip.driver_name) &&
            trip.status !== "scheduled" &&
            trip.status !== "pending" && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiUser className="w-5 h-5" />
                  Driver Information
                </h2>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {(trip.driver?.full_name || trip.driver_name || "D")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {trip.driver?.full_name || trip.driver_name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <FiStar className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                      <span className="text-yellow-600 font-semibold">
                        {Number(trip.driver?.rating || 5.0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact and Car Details */}
                <div className="space-y-3">
                  {(trip.driver?.phone || trip.driver_phone) && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        const phone = trip.driver?.phone || trip.driver_phone;
                        if (phone) window.location.href = `tel:${phone}`;
                      }}
                    >
                      <FiPhone className="w-5 h-5" />
                      {trip.driver?.phone || trip.driver_phone}
                    </Button>
                  )}

                  {trip.driver?.car && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 font-medium mb-2 flex items-center gap-2">
                        VEHICLE INFORMATION
                      </p>
                      <p className="text-gray-900 font-semibold">
                        {trip.driver.car.model}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        License Plate: {trip.driver.car.license_plate}
                      </p>
                      {trip.driver.car.color && (
                        <p className="text-sm text-gray-600">
                          Color: {trip.driver.car.color}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Fare Breakdown */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiDollarSign className="w-5 h-5" />
              Fare Breakdown
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Base Fare</span>
                <span className="font-semibold text-gray-900">
                  {safeBasePrice.toFixed(2)} XOF
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Distance / Hourly Charge</span>
                <span className="font-semibold text-gray-900">
                  {safeDistanceCharge.toFixed(2)} XOF
                </span>
              </div>

              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-blue-600">
                  {safeTotalPrice.toFixed(2)} XOF
                </span>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          {trip.status === "completed" && !trip.rating && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Rate Your Trip
              </h3>
              <p className="text-gray-600 mb-4">
                Please rate your experience with the driver
              </p>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowRatingModal(true)}
                disabled={isApiLoading}
              >
                <FiStar className="w-4 h-4" />
                Rate Driver
              </Button>
            </div>
          )}

          {/* Already Rated */}
          {trip.rating && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Your Rating
              </h3>
              <div className="flex items-center gap-2 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    className={`w-5 h-5 ${
                      i < trip.rating!.rating
                        ? "text-yellow-600 fill-yellow-600"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="text-yellow-600 font-semibold ml-2">
                  {trip.rating.rating}/5
                </span>
              </div>
              {trip.rating.review && (
                <p className="text-gray-700 mt-2">"{trip.rating.review}"</p>
              )}
              {trip.rating.created_at && (
                <p className="text-xs text-gray-500 mt-2">
                  Rated on{" "}
                  {new Date(trip.rating.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Cancel Button */}
          {["pending", "scheduled", "assigned", "accepted"].includes(trip.status) && (
            <div className="mb-6">
              <Button
                variant="danger"
                fullWidth
                onClick={() => setShowCancelModal(true)}
                disabled={isApiLoading}
              >
                <FiX className="w-5 h-5" />
                Cancel Trip
              </Button>
            </div>
          )}
        </div>

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Rate Your Trip
              </h2>

              {/* Star Rating */}
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  How would you rate this trip?
                </p>
                <div className="flex justify-center gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedRating(i + 1)}
                      className="focus:outline-none transition"
                    >
                      <FiStar
                        className={`w-10 h-10 transition ${
                          i < selectedRating
                            ? "text-yellow-600 fill-yellow-600"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a comment (optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with the driver..."
                  rows={3}
                  disabled={isSubmittingRating}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setShowRatingModal(false);
                    setSelectedRating(5);
                    setReviewText("");
                  }}
                  disabled={isSubmittingRating}
                >
                  Cancel
                </Button>

                <Button
                  variant="primary"
                  fullWidth
                  isLoading={isSubmittingRating}
                  onClick={handleRateTrip}
                  disabled={isSubmittingRating}
                >
                  {!isSubmittingRating && <FiStar className="w-4 h-4" />}
                  {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Trip Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <FiAlertCircle className="w-6 h-6 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Cancel Trip
              </h2>

              <p className="text-gray-600 text-center mb-4">
                Are you sure you want to cancel this trip?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please tell us why you're cancelling..."
                  rows={3}
                  disabled={isCancelling}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason("");
                  }}
                  disabled={isCancelling}
                >
                  Keep Trip
                </Button>

                <Button
                  variant="danger"
                  fullWidth
                  isLoading={isCancelling}
                  onClick={handleCancelTrip}
                  disabled={isCancelling || !cancelReason.trim()}
                >
                  {!isCancelling && <FiX className="w-4 h-4" />}
                  {isCancelling ? 'Cancelling...' : 'Cancel Trip'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}