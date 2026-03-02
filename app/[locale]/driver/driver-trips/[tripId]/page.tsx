"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import toast from "react-hot-toast";
import {
  FiArrowLeft, FiLoader, FiMapPin, FiClock, FiDollarSign,
  FiPhone, FiCheckCircle, FiAlertCircle, FiNavigation, FiKey
} from "react-icons/fi";
import { Badge } from "@/components/common/Badge";

export default function DriverTripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string;
  const locale = params?.locale || 'en';
  const { request, isLoading: isApiLoading } = useApi({ showSuccess: true });

  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    loadTripDetails(true);
    const interval = setInterval(() => loadTripDetails(false), 5000);
    return () => clearInterval(interval);
  }, [tripId]);

  const loadTripDetails = async (showSpinner = true) => {
    if (!tripId) return;
    if (showSpinner) setIsLoading(true);
    try {
      const data = await request<any>(() => apiClient.getAllTripDetails(tripId));
      if (data) setTrip(data);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  };

 const handleStartTrip = async () => {
  // Use <any> after the request call
  const result = await request<any>(() => apiClient.startTrip(tripId, otp));

  // Now TypeScript won't complain about .success
  if (result && result.success) {
    toast.success("Trip started successfully!");
    loadTripDetails();
  }
};

  const handleEndTrip = async () => {
    // In a real app, you'd calculate final distance/price here
    const result = await request(() => apiClient.endTrip(tripId, {
      actualDistance: trip.estimated_distance,
      actualDuration: trip.estimated_duration,
      finalPrice: trip.total_price
    }));
    if (result) {
      toast.success("Trip completed!");
      router.push(`/${locale}/driver/trips`);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin w-8 h-8 text-primary"/></div>;
  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button onClick={() => router.back()} className="flex items-center text-primary mb-6">
          <FiArrowLeft className="mr-2" /> Back
        </button>

        {/* Status Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 flex justify-between items-center border-t-4 border-primary">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
            <p className="text-sm text-gray-500">ID: {trip.id}</p>
          </div>
          <Badge variant="info" label={trip.status} />
        </div>

        {/* Route Card */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Pickup Address</p>
              <p className="text-gray-900 font-medium">{trip.pickup_address}</p>
            </div>
            <div className="border-l-2 border-dashed border-gray-200 ml-2 h-8"></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Destination Address</p>
              <p className="text-gray-900 font-medium">{trip.destination_address || 'Open Destination'}</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${trip.pickup_latitude},${trip.pickup_longitude}`)}
              className="flex-1 bg-blue-50 text-blue-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <FiNavigation /> Navigate
            </button>
            <button 
              onClick={() => window.location.href = `tel:${trip.client_phone}`}
              className="flex-1 bg-green-50 text-green-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
            >
              <FiPhone /> Call Client
            </button>
          </div>
        </div>

        {/* Driver Actions (OTP) */}
        {trip.status === 'accepted' && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiKey /> Start Trip Verification
            </h3>
            <p className="text-sm text-gray-600 mb-4">Ask the client for the 6-digit OTP code to begin the ride.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="flex-1 border rounded-lg px-4 py-2 text-center text-xl tracking-widest focus:ring-2 focus:ring-primary outline-none"
              />
              <button 
                onClick={handleStartTrip}
                disabled={isApiLoading}
                className="bg-primary text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                Start
              </button>
            </div>
          </div>
        )}

        {/* Complete Trip Action */}
        {trip.status === 'in_progress' && (
          <button 
            onClick={handleEndTrip}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
            <FiCheckCircle /> Complete Trip
          </button>
        )}

        {/* Fare Card */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiDollarSign /> Estimated Earnings
          </h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Fare</span>
            <span className="text-2xl font-black text-primary">{trip.total_price} XOF</span>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}