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
  FiAlertCircle,
  FiNavigation
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
  const [activeField, setActiveField] = useState<"pickup" | "dropoff">("pickup");

  const [formData, setFormData] = useState<BookingFormData>({
    pickupLocation: { address: "", latitude: 0, longitude: 0 },
    dropoffLocation: { address: "", latitude: 0, longitude: 0 },
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    bookingType: "point-to-point",
    hourlyDuration: 1, 
    passengers: 1,
    specialRequests: "",
    paymentMethod: "cash",
    promoCode: "",
    termsAccepted: false,
  });

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
    if (!formData.pickupLocation?.address?.trim()) newErrors.pickup = "Required";
    if (formData.bookingType === "point-to-point" && !formData.dropoffLocation?.address?.trim()) newErrors.dropoff = "Required";
    if (!formData.date) newErrors.date = "Required";
    if (!formData.time) newErrors.time = "Required";
    if (!formData.termsAccepted) newErrors.terms = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEstimateFare = async () => {
    if (!formData.pickupLocation?.latitude || (formData.bookingType === 'point-to-point' && !formData.dropoffLocation?.latitude)) {
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
        const res = await fetch(`${osrmBaseUrl}/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true`);
        const data = await res.json();
        
        if (data.code === "Ok") {
          // Sort by distance to find the shortest road distance
          const sortedRoutes = [...data.routes].sort((a, b) => a.distance - b.distance);
          const route = sortedRoutes[0];
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

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
      const res = await fetch(`${baseUrl}/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      const location = { address, latitude: lat, longitude: lng };
      
      if (activeField === "pickup") {
        handlePickupChange(location);
        // Switch to dropoff automatically if it's empty
        if (!formData.dropoffLocation.address && formData.bookingType === 'point-to-point') {
          setActiveField("dropoff");
        }
      } else {
        handleDropoffChange(location);
      }
      toast.success(`${activeField === 'pickup' ? t('client.pickup') : t('client.destination')} set!`);
    } catch (error) {
      console.error("Map click error:", error);
      toast.error("Failed to get address from map");
    }
  };

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleProceedToConfirmation = () => {
    if (validateForm() && fareEstimate) setBookingStep("confirmation");
    else toast.error("Please complete the form and get an estimate first.");
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
        toast.success("Booking confirmed!");
        setBookingStep("success");
        setTimeout(() => router.push(`/${locale}/client/client-trips/${result.trip.id}`), 3000);
      }
    } catch (e) { toast.error("Booking failed"); } finally { setIsLoading(false); }
  };

  if (bookingStep === "success") {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-transparent">
          <div className="bg-white/90 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-12 max-w-lg w-full text-center border border-white/40 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20"></div>
                <FiCheck className="w-12 h-12 text-green-500 relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">{t('client.bookingConfirmed')}</h1>
            <p className="text-gray-500 mb-10 leading-relaxed font-medium">{t('landing.heroSubtitle')}</p>
            
            <div className="bg-gray-50/50 backdrop-blur-sm p-8 rounded-[32px] text-left mb-10 border border-gray-100 space-y-4 shadow-inner">
                <div className="flex gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                      <FiMapPin className="text-primary w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{t('client.pickup')}</p>
                      <p className="text-base font-bold text-gray-800 line-clamp-1">{formData.pickupLocation?.address || 'N/A'}</p>
                   </div>
                </div>
                <div className="flex gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 shadow-sm">
                      <FiDollarSign className="text-orange-600 w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">{t('client.total')}</p>
                      <p className="text-base font-black text-gray-900">{fareEstimate?.estimatedFare?.toLocaleString()} FCFA</p>
                   </div>
                </div>
            </div>
            
            <p className="text-gray-300 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">{t('client.redirecting')}</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (bookingStep === "confirmation") {
    return (
      <ProtectedRoute allowedRoles={["client"]}>
        <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 flex items-center justify-center">
          <div className="max-w-xl w-full bg-white/90 backdrop-blur-3xl rounded-[48px] shadow-[0_40px_80px_rgba(0,0,0,0.1)] overflow-hidden border border-white/50">
            <div className="bg-primary p-8 text-white flex justify-between items-center relative overflow-hidden">
               <div className="relative z-10">
                <h1 className="text-3xl font-black tracking-tighter mb-1">{t('client.reviewRide')}</h1>
                <p className="text-blue-100/80 font-medium text-sm">{t('client.reviewBooking')}</p>
               </div>
               <div className="w-16 h-16 bg-white/10 rounded-3xl rotate-12 flex items-center justify-center backdrop-blur-lg">
                  <FiClock size={32} />
               </div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="bg-gray-50/50 p-6 rounded-[28px] border border-gray-100 flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('client.pickup')}</p>
                    <p className="font-bold text-gray-900 leading-snug">{formData.pickupLocation?.address}</p>
                  </div>
                </div>
                
                {formData.bookingType === 'point-to-point' && (
                <div className="bg-gray-50/50 p-6 rounded-[28px] border border-gray-100 flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2"></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('client.destination')}</p>
                    <p className="font-bold text-gray-900 leading-snug">{formData.dropoffLocation?.address}</p>
                  </div>
                </div>
                )}
                
                <div className="bg-primary/5 p-6 rounded-[32px] border-2 border-primary/20 flex flex-col items-center text-center">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-3">{t('client.totalPrice')}</p>
                    <p className="text-5xl font-black text-primary tracking-tighter">{fareEstimate?.estimatedFare?.toLocaleString()} <span className="text-base font-bold ml-1 uppercase">FCFA</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-col-reverse">
                <Button 
                  variant="ghost" 
                  onClick={() => setBookingStep("details")}
                  className="!rounded-3xl font-black text-gray-400 uppercase tracking-widest text-xs py-3"
                >
                  {t("common.back")}
                </Button>
                <Button 
                  variant="primary" 
                  size="lg"
                  className="!rounded-[24px] shadow-[0_15px_35px_rgba(var(--primary-rgb),0.3)] font-black text-base py-3"
                  isLoading={isLoading} 
                  onClick={handleConfirmBooking}
                >
                  {!isLoading && t('client.confirm')}
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
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tighter mb-4">{t('client.bookRide')}</h1>
            <p className="text-gray-400 font-medium max-w-md mx-auto">{t('landing.heroSubtitle')}</p>
          </div>

          {/* Centered Map Card */}
          <div className="sticky top-6 bg-white rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white h-[300px] sm:h-[400px] transition-all group z-30">
             <UnifiedRouteMap 
              pickup={formData.pickupLocation?.latitude ? formData.pickupLocation : null} 
              dropoff={formData.dropoffLocation?.latitude ? formData.dropoffLocation : null} 
              routeGeometry={routeGeometry} 
              onMapClick={handleMapClick}
            />
            {/* Live Status Overlay */}
            <div className="absolute top-6 left-6 z-10">
               <div className="bg-white/90 backdrop-blur-xl py-2 px-4 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">{t('client.liveTripInfo')}</span>
               </div>
            </div>
          </div>

          {/* Centered Booking Card */}
          <div className="bg-white/70 backdrop-blur-3xl rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-white/50 overflow-hidden relative z-10 -mt-6">
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Type Selector */}
              <div className="bg-gray-100/50 p-2 rounded-[28px] flex gap-2 border-none">
                <button 
                  onClick={() => setFormData(p => ({...p, bookingType: 'point-to-point'}))}
                  className={`flex-1 py-3 px-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-none outline-none focus:outline-none focus:ring-0 ${formData.bookingType === 'point-to-point' ? 'bg-white text-primary shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t('client.ride')}
                </button>
                <button 
                  onClick={() => setFormData(p => ({...p, bookingType: 'hourly'}))}
                  className={`flex-1 py-3 px-4 rounded-[22px] font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 border-none outline-none focus:outline-none focus:ring-0 ${formData.bookingType === 'hourly' ? 'bg-white text-primary shadow-sm scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {t('client.rentHourly')}
                </button>
              </div>

              {/* Route Section */}
              <div className="space-y-6">
                 <div className="flex items-center gap-4 mb-2">
                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{t('client.routeDetails')}</h2>
                 </div>

                 <div className="grid grid-cols-1 gap-6 relative">
                   <div className="space-y-4">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${activeField === 'pickup' ? 'text-primary' : 'text-gray-400'}`}>{t('client.pickup')}</label>
                      <LocationPicker 
                        value={formData.pickupLocation} 
                        onChange={handlePickupChange} 
                        onFocus={() => setActiveField("pickup")}
                        placeholder={t('client.wherePickingUp')}
                        error={errors.pickup} 
                      />
                   </div>

                   {formData.bookingType === 'point-to-point' && (
                   <div className="space-y-4 relative">
                      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${activeField === 'dropoff' ? 'text-primary' : 'text-gray-400'}`}>{t('client.destination')}</label>
                      <LocationPicker 
                        value={formData.dropoffLocation} 
                        onChange={handleDropoffChange} 
                        onFocus={() => setActiveField("dropoff")}
                        placeholder={t('client.whereHeading')} 
                        error={errors.dropoff} 
                      />
                      {/* Vertical line connector */}
                      <div className="absolute left-[20px] -top-[40px] w-[2px] h-[30px] bg-gradient-to-b from-primary/20 to-transparent"></div>
                   </div>
                   )}

                   {formData.bookingType === 'hourly' && pricingConfig?.hourly_rates && (
                    <div className="space-y-4">
                         <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-1">{t('client.rentalDuration')}</label>
                         <select 
                          name="hourlyDuration" 
                          value={formData.hourlyDuration} 
                          onChange={handleInputChange} 
                          className="w-full p-4 bg-primary/5 border-none rounded-[24px] focus:ring-0 outline-none font-black text-primary text-sm appearance-none cursor-pointer transition-all hover:bg-primary/10"
                        >
                          {Object.entries(pricingConfig.hourly_rates).map(([hours, rate]) => (
                            <option key={hours} value={hours}>
                              {hours} {t('common.period')} • {Number(rate).toLocaleString()} FCFA
                            </option>
                          ))}
                        </select>
                    </div>
                  )}
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('client.tripDate')}</label>
                       <input 
                        type="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleInputChange} 
                        className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-[24px] outline-none font-bold text-gray-800 text-sm focus:border-primary transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('client.tripTime')}</label>
                       <input 
                        type="time" 
                        name="time" 
                        value={formData.time} 
                        onChange={handleInputChange} 
                        className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-[24px] outline-none font-bold text-gray-800 text-sm focus:border-primary transition-all" 
                      />
                    </div>
                 </div>
              </div>

              {/* Ride Options Section */}
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{t('client.rideOptions')}</h2>
                 </div>
                 <div className="grid grid-cols-1 gap-6">
                   <PassengerSelector size="lg" value={formData.passengers} onChange={(v) => setFormData(p => ({...p, passengers: v}))} maxPassengers={6} />
                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('client.paymentFinalize')}</label>
                     <PaymentSelector value={formData.paymentMethod} onChange={(m) => setFormData(p => ({...p, paymentMethod: m}))} />
                   </div>
                 </div>
              </div>

              {/* Terms & CTA Section */}
              <div className="space-y-6 pt-4">
                 <div className="bg-gray-50/50 p-6 rounded-[28px] border border-gray-100 group">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="termsAccepted" 
                        checked={formData.termsAccepted} 
                        onChange={handleInputChange} 
                        className="w-5 h-5 text-primary rounded-lg border-gray-200 mt-0.5 focus:ring-0 transition-all cursor-pointer"
                      />
                      <span className="text-[13px] font-bold text-gray-400 leading-relaxed group-hover:text-gray-600 transition-colors">
                        {t('client.termsAgreement')} <a href="#" className="text-primary hover:underline">{t('client.termsOfUse')}</a> {t('common.and')} <a href="#" className="text-primary hover:underline">{t('client.privacyPolicy')}</a>
                      </span>
                    </label>
                    {errors.terms && <p className="text-red-500 text-[10px] font-black uppercase mt-3 ml-9 flex items-center gap-2 animate-bounce"><FiAlertCircle className="shrink-0" /> {errors.terms}</p>}
                 </div>

                 <div className="space-y-4">
                    {fareEstimate && (
                      <div className="animate-in slide-in-from-bottom-4 duration-700">
                        <FareEstimate 
                          estimate={fareEstimate} 
                          bookingType={formData.bookingType} 
                          passengers={formData.passengers} 
                          isLoading={isEstimating} 
                        />
                      </div>
                    )}

                    <Button 
                      variant={fareEstimate ? "primary" : "success"}
                      fullWidth 
                      size="lg" 
                      className={`!py-4 !rounded-[28px] text-base font-black tracking-tight shadow-2xl active:scale-[0.98] transition-all duration-300 ${!fareEstimate ? 'bg-green-600 shadow-green-600/20' : 'shadow-primary/30'}`}
                      onClick={fareEstimate ? handleProceedToConfirmation : handleEstimateFare}
                      isLoading={isEstimating || isLoading}
                      disabled={!formData.date || !formData.time || !formData.pickupLocation?.address || (formData.bookingType === 'point-to-point' && !formData.dropoffLocation?.address)}
                    >
                      {fareEstimate 
                        ? t('client.reviewRide') 
                        : (isEstimating ? t('client.calculating') : t('client.findBestFare'))}
                    </Button>
                    
                    <div className="flex justify-center items-center gap-3">
                       <FiCheck className="text-green-500 w-4 h-4" />
                       <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t('client.reliableService')}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}