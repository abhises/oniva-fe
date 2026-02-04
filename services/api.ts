import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  messageKey?: string; // Backend returns messageKey
  data?: T;
  code?: string;
}

interface ApiError {
  messageKey?: string;
  message?: string;
  statusCode?: number;
}

class ApiClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
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
          window.location.href = '/en/login'; // Redirect to login
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(phone: string, fullName: string, password: string, role: string) {
    const { data } = await this.instance.post<ApiResponse>('/api/auth/register', {
      phone,
      fullName,
      password,
      role,
    });
    return data;
  }

  async login(phone: string, password: string) {
    const { data } = await this.instance.post<ApiResponse>('/api/auth/login', {
      phone,
      password,
    });
    return data;
  }

  // Client endpoints
  async getProfile() {
    const { data } = await this.instance.get<ApiResponse>('/api/client/profile');
    return data;
  }

  async estimateFare(bookingType: string, distance: number, pickupTime: string) {
    const { data } = await this.instance.post<ApiResponse>('/api/client/estimate-fare', {
      bookingType,
      distance,
      pickupTime,
    });
    return data;
  }

  async bookTrip(tripData: any) {
    const { data } = await this.instance.post<ApiResponse>('/api/client/book-trip', tripData);
    return data;
  }

  async getTrips() {
    const { data } = await this.instance.get<ApiResponse>('/api/client/trips');
    return data;
  }

  // Driver endpoints
  async createDriverProfile(profileData: any) {
    const { data } = await this.instance.post<ApiResponse>('/api/driver/profile', profileData);
    return data;
  }

  async updateLocation(latitude: number, longitude: number) {
    const { data } = await this.instance.post<ApiResponse>('/api/driver/location', {
      latitude,
      longitude,
    });
    return data;
  }

  async setOnlineStatus(isOnline: boolean) {
    const { data } = await this.instance.post<ApiResponse>('/api/driver/status', {
      isOnline,
    });
    return data;
  }

  // Admin endpoints
  async getAdminDashboard() {
    const { data } = await this.instance.get<ApiResponse>('/api/admin/dashboard');
    return data;
  }

  async getDrivers() {
    const { data } = await this.instance.get<ApiResponse>('/api/admin/drivers');
    return data;
  }

  async approveDriver(driverId: number) {
    const { data } = await this.instance.post<ApiResponse>(
      `/api/admin/drivers/${driverId}/approve`,
      {}
    );
    return data;
  }
}

export const apiClient = new ApiClient();