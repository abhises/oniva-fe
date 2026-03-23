import axios, { AxiosInstance, AxiosError } from "axios";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

console.log("ENV VALUE:", process.env.NEXT_PUBLIC_API_URL);
console.log("BASE URL USED:", API_BASE_URL);
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  messageKey?: string;
  data?: T;
  code?: string;
}

interface ApiError {
  messageKey?: string;
  message?: string;
  statusCode?: number;
}

interface FareEstimateData {
  bookingType: "point-to-point" | "hourly";
  distance?: number;
  hours?: number;
  pickupTime: string;
  date?: string;
}

interface RateTripData {
  rating: number;
  review?: string;
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add token to requests
    this.instance.interceptors.request.use((config) => {
      const { token } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle responses and errors
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") {
            window.location.href = "/en/login";
          }
        }
        return Promise.reject(error);
      },
    );
  }

  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================

  async register(data: {
    phone: string;
    fullName: string;
    password: string;
    role: "client" | "driver";
    language?: string;
  }) {
    const { data: response } = await this.instance.post<ApiResponse>(
      "/api/auth/register",
      data,
    );
    return response;
  }

  async login(data: { phone: string; password: string }) {
    const { data: response } = await this.instance.post<ApiResponse>(
      "/api/auth/login",
      data,
    );
    return response;
  }

  async verifyToken(token: string) {
    const { data: response } = await this.instance.post<ApiResponse>(
      "/api/auth/verify-token",
      { token },
    );
    return response;
  }

  // ============================================================================
  // CLIENT ENDPOINTS
  // ============================================================================

  async getClientProfile() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/client/profile",
    );
    return data;
  }

  async getActivePrice() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/client/pricing/active",
    );
    return data;
  }

  async estimateFare(fareData: FareEstimateData) {
    const { data } = await this.instance.post<ApiResponse>(
      "/api/client/estimate-fare",
      fareData,
    );
    return data;
  }

  async bookTrip(tripData: any) {
    const { data } = await this.instance.post<ApiResponse>(
      "/api/client/book-trip",
      tripData,
    );
    return data;
  }

  async getTrips(params?: { limit?: number; offset?: number }) {
    const { data } = await this.instance.get<ApiResponse>("/api/client/trips", {
      params,
    });
    return data;
  }

  async getTripDetails(tripId: string) {
    const { data } = await this.instance.get<ApiResponse>(
      `/api/client/trips/${tripId}`,
    );
    return data;
  }

  async rateTrip(tripId: string, ratingData: RateTripData) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/client/trips/${tripId}/rate`,
      ratingData,
    );
    return data;
  }

  async cancelTrip(tripId: string, reason?: string) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/client/trips/${tripId}/cancel`,
      { reason },
    );
    return data;
  }

  // ============================================================================
  // DRIVER ENDPOINTS
  // ============================================================================

  // Inside your ApiClient class in app/services/api.ts

  async getDriverDashboardStats() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/driver/dashboard-stats",
    );
    return data;
  }

  async createDriverProfile(profileData: any) {
    const { data } = await this.instance.post<ApiResponse>(
      "/api/driver/profile",
      profileData,
    );
    return data;
  }

  async getDriverProfile() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/driver/profile",
    );
    return data;
  }

  async updateLocation(locationData: { latitude: number; longitude: number }) {
    const { data } = await this.instance.post<ApiResponse>(
      "/api/driver/location",
      locationData,
    );
    return data;
  }

  async setOnlineStatus(isOnline: boolean) {
    const { data } = await this.instance.post<ApiResponse>(
      "/api/driver/status",
      { isOnline },
    );
    return data;
  }

  async getPendingRequests() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/driver/pending-requests",
    );
    return data;
  }

  async getDriverTrips() {
    const { data } = await this.instance.get<ApiResponse>(`/api/driver/trips`);
    return data;
  }

  async acceptRequest(requestId: string) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/driver/requests/${requestId}/accept`,
      {},
    );
    return data;
  }

  async rejectRequest(requestId: string, reason?: string) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/driver/requests/${requestId}/reject`,
      { reason },
    );
    return data;
  }

  async getRequestById(requestId: string) {
    const { data } = await this.instance.get<ApiResponse>(
      `/api/driver/requests/${requestId}`,
    );
    return data;
  }

  // Inside your ApiClient class
  async startTrip(tripId: string | number, otp: string) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/driver/trips/${tripId}/start`,
      { otp }, // This sends { "otp": "306813" } to the backend
    );
    return data;
  }

  async endTrip(tripId: string, tripData: any) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/driver/trips/${tripId}/end`,
      tripData,
    );
    return data;
  }

  async getEarnings(params: { startDate: string; endDate: string }) {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/driver/earnings",
      { params },
    );
    return data;
  }

  // Inside your ApiClient class
  async checkDriverStatus() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/driver/checkDriverCreation",
    );
    return data;
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  async getAdminDashboard() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/admin/dashboard",
    );
    return data;
  }

  async getAdminDrivers() {
    const { data } = await this.instance.get<ApiResponse>("/api/admin/drivers");
    return data;
  }

  async approveDriver(driverId: number) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/admin/drivers/${driverId}/approve`,
      {},
    );
    return data;
  }

  async rejectDriver(driverId: number, reason?: string) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/admin/drivers/${driverId}/reject`,
      { reason },
    );
    return data;
  }

  async suspendDriver(driverId: number, reason?: string) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/admin/drivers/${driverId}/suspend`,
      { reason },
    );
    return data;
  }

  // Get current active pricing (optional, if you still use it)
  // Get current active pricing
  async getPricing() {
    const { data } = await this.instance.get<ApiResponse>("/api/admin/pricing");
    return data;
  }

  // Get pricing history
  async getPricingHistory() {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/admin/pricing/history",
    );
    return data; // <--- FIX: Return the full object, let useApi extract the array!
  }

  // Create NEW pricing configuration
  async createPricing(pricingData: any) {
    const { data } = await this.instance.post<ApiResponse>(
      "/api/admin/pricing",
      pricingData,
    );
    return data;
  }

  // Activate an old pricing configuration
  async activatePricing(id: number) {
    const { data } = await this.instance.put<ApiResponse>(
      `/api/admin/pricing/${id}/activate`,
    );
    return data;
  }

  // Add to the ApiClient class in app/services/api.ts

  async getUsers(params?: { limit?: number; offset?: number; role?: string }) {
    const { data } = await this.instance.get<ApiResponse<User[]>>(
      "/api/admin/users",
      { params },
    );
    return data; // Return the full ApiResponse object
  }

  async suspendUser(userId: string, reason?: string) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/admin/users/${userId}/suspend`,
      { reason },
    );
    return data;
  }

  async getAllTripDetails(tripId: string | number) {
    const { data } = await this.instance.get<ApiResponse>(
      `/api/trips/${tripId}`,
    );
    // We return the whole 'data' object (ApiResponse)
    // so your 'useApi' hook can handle success/error states
    return data;
  }
  // Add to the ApiClient class in app/services/api.ts
  async getAdminActiveTrips(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { data } = await this.instance.get<ApiResponse>(
      "/api/admin/trips/active",
      { params },
    );
    return data;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get axios instance for custom requests
   */
  getInstance() {
    return this.instance;
  }

  /**
   * Set authorization token manually
   */
  setToken(token: string) {
    this.instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Clear authorization token
   */
  clearToken() {
    delete this.instance.defaults.headers.common["Authorization"];
  }
}

export const apiClient = new ApiClient();
