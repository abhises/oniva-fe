"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic"; // <-- Import dynamic here
import { useAuth } from "@/hooks/useAuth";
import { useApi } from "@/hooks/useApi";
import { apiClient } from "@/services/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  FiArrowLeft, FiLoader, FiMapPin, FiClock, FiDollarSign,
  FiPhone, FiCheckCircle, FiAlertCircle, FiNavigation, FiKey
} from "react-icons/fi";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";

// Dynamically import the map component with SSR disabled
const MapRoute = dynamic(() => import('./MapRoute'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center mb-6">
      <FiLoader className="animate-spin text-primary w-6 h-6" />
    </div>
  )
});

export default function DriverTripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params?.tripId as string;
  const locale = params?.locale || 'en';
  
  const { user } = useAuth();
  const { request, isLoading: isApiLoading } = useApi({ showSuccess: true });

  const [trip, setTrip] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otp, setOtp] = useState("");

  const loadTripDetails = useCallback(async (showSpinner = true) => {
    if (!tripId) return;
    if (showSpinner) setIsLoading(true);
    try {
      const data = await request<any>(() => apiClient.getAllTripDetails(tripId));
      if (data) setTrip(data);
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [tripId, request]);

  useEffect(() => {
    loadTripDetails(true);
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socket = io(socketUrl);

    if (user?.id) {
      socket.emit('auth', { userId: user.id, userRole: 'driver' });
      socket.emit('join_trip_room', { tripId });
    }

    socket.on('trip_updated', (data) => {
      if (String(data.tripId) === String(tripId) || String(data.trip_id) === String(tripId)) {
        loadTripDetails(false);
      }
    });

    socket.on('trip_cancelled', (data) => {
      if (String(data.tripId) === String(tripId) || String(data.trip_id) === String(tripId)) {
        toast.error("The client cancelled this trip.");
        router.push(`/${locale}/driver/driver-trips`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [tripId, user?.id, loadTripDetails, router, locale]);

  const handleStartTrip = async () => {
    const result = await request<any>(() => apiClient.startTrip(tripId, otp));
    if (result) {
      toast.success("Trip started successfully!");
      setTrip((prevTrip: any) => ({
        ...prevTrip,
        status: 'in_progress'
      }));
      loadTripDetails(false); 
    }
  };

  const handleEndTrip = async () => {
    const result = await request(() => apiClient.endTrip(tripId, {
      actualDistance: trip.estimated_distance,
      actualDuration: trip.estimated_duration,
      finalPrice: trip.total_price
    }));
    if (result) {
      toast.success("Trip completed!");
      router.push(`/${locale}/driver/driver-trips`);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><FiLoader className="animate-spin w-8 h-8 text-primary"/></div>;
  if (!trip) return <div className="p-8 text-center">Trip not found</div>;

  // Check if we have both coordinates to render the map securely
  const hasCoordinates = trip.pickup_latitude && trip.pickup_longitude && trip.destination_latitude && trip.destination_longitude;

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <FiArrowLeft className="mr-2" /> Back
        </Button>

        {/* Status Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 flex justify-between items-center border-t-4 border-primary">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trip Details</h1>
            <p className="text-sm text-gray-500">ID: {trip.id}</p>
          </div>
          <Badge variant="info" label={trip.status} />
        </div>

        {/* Leaflet Map Component */}
        {hasCoordinates && (
          <div className="mb-6">
            <MapRoute 
              pickup={[parseFloat(trip.pickup_latitude), parseFloat(trip.pickup_longitude)]}
              destination={[parseFloat(trip.destination_latitude), parseFloat(trip.destination_longitude)]}
            />
          </div>
        )}

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
            <Button
              variant="primary"
              fullWidth
              onClick={() => window.open(`https://maps.google.com/?q=${trip.pickup_latitude},${trip.pickup_longitude}`)}
            >
              <FiNavigation /> Navigate
            </Button>
            <Button
              variant="success"
              fullWidth
              onClick={() => window.location.href = `tel:${trip.client_phone}`}
            >
              <FiPhone /> Call Client
            </Button>
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
              <Button
                variant="primary"
                isLoading={isApiLoading}
                disabled={isApiLoading}
                onClick={handleStartTrip}
              >
                Start
              </Button>
            </div>
          </div>
        )}

        {/* Complete Trip Action */}
        {trip.status === 'in_progress' && (
          <Button
            variant="success"
            fullWidth
            size="lg"
            isLoading={isApiLoading}
            onClick={handleEndTrip}
          >
            <FiCheckCircle /> Complete Trip
          </Button>
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