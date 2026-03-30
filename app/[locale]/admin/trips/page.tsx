'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { useLocale } from '@/hooks/useLocale'
import { apiClient } from '@/services/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/common/Button'
import toast from 'react-hot-toast'
import { io } from 'socket.io-client'
import {
  FiArrowLeft,
  FiLoader,
  FiMapPin,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiFilter,
  FiRefreshCw,
} from 'react-icons/fi'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

const DriverMarkerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// --- Interfaces ---
interface ActiveTrip {
  id: string | number
  status: 'scheduled' | 'assigned' | 'started'
  pickupAddress: string
  dropoffAddress: string
  distance: number
  duration: number
  totalPrice: number
  baseFare: number
  distanceCharge: number
  surcharge?: number
  createdAt: string
  assignedAt?: string
  startedAt?: string

  client: {
    id: string | number
    name: string
    phone: string
    email: string
    rating: number
  }

  driver?: {
    id: string | number
    name: string
    phone: string
    email: string
    rating: number
    isOnline: boolean
    location?: {
      latitude: number
      longitude: number
    }
    car?: {
      model: string
      licensePlate: string
      color: string
    }
  }
}

interface TripStats {
  scheduled: number
  assigned: number
  started: number
  completed: number
  total: number
}

interface AdminTripsResponse {
  success: boolean;
  data: ActiveTrip[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  stats: TripStats;
}

export default function AdminTripsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLocale()
  const { request, isLoading: isApiLoading } = useApi({ showSuccess: false })

  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([])
  const [stats, setStats] = useState<TripStats>({
    scheduled: 0,
    assigned: 0,
    started: 0,
    completed: 0,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'assigned' | 'started' | 'completed'>('all')
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  })

  const loadActiveTrips = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setIsLoading(true);

      const response = await apiClient.getAdminActiveTrips({
        status: statusFilter,
        limit: pagination.limit,
        offset: pagination.offset
      }) as unknown as AdminTripsResponse;

      if (response && response.success && response.data) {
        setActiveTrips(response.data);
        if (response.stats) setStats(response.stats);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore
          }));
        }
      } else if (response && !response.success) {
        if (showSpinner) toast.error(t('admin.failedLoadTrips'));
      }

    } catch (error: any) {
      console.error('Error loading trips:', error);
      if (showSpinner) toast.error(t('admin.failedLoadTrips'));
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [statusFilter, pagination.limit, pagination.offset, t]);

  useEffect(() => {
    loadActiveTrips(true);

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const socket = io(socketUrl);

    if (user?.id) {
      socket.emit('auth', { userId: user.id, userRole: 'admin' });
    }

    const handleSocketUpdate = (data: any) => {
      console.log('Real-time update received:', data);
      loadActiveTrips(false);
    };

    socket.on('trip_status_changed', handleSocketUpdate);
    socket.on('driver_accepted', handleSocketUpdate);
    socket.on('driver_rejected', handleSocketUpdate);

    return () => {
      socket.disconnect();
    };
  }, [loadActiveTrips, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'started': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-800 text-white'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return '📋'
      case 'assigned': return '✅'
      case 'started': return '🚗'
      case 'completed': return '🏆'
      case 'cancelled': return '❌'
      default: return '❓'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all': return t('common.all')
      case 'scheduled': return t('admin.scheduled')
      case 'assigned': return t('admin.assigned')
      case 'started': return t('admin.started')
      case 'completed': return t('common.completed')
      case 'cancelled': return t('client.tripCancelled')
      default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  const handleViewTrip = (tripId: string | number) => {
    router.push(`/en/admin/trips/${tripId}`)
  }

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.loadingTrips')}</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <FiArrowLeft className="w-4 h-4" />
              {t('common.back')}
            </Button>

            <div className="flex items-center justify-between bg-white rounded-lg shadow-lg p-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('admin.activeTrips')}</h1>
                <p className="text-gray-600 mt-1">{t('admin.activeTripsMonitoring')}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/en/admin/incidents`)}
                >
                  {t('admin.viewIncidents')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadActiveTrips(true)}
                  disabled={isApiLoading}
                  title="Refresh"
                >
                  <FiRefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6 border-b-4 border-purple-500">
              <p className="text-sm text-gray-600">{t('admin.scheduled')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.scheduled || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-b-4 border-blue-500">
              <p className="text-sm text-gray-600">{t('admin.assigned')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.assigned || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-b-4 border-green-500">
              <p className="text-sm text-gray-600">{t('admin.inProgress')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.started || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-b-4 border-gray-800">
              <p className="text-sm text-gray-600">{t('common.completed')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.completed || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6 border-b-4 border-gray-200">
              <p className="text-sm text-gray-600">{t('admin.total')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
            </div>
          </div>

          {/* Live Map */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{t('admin.liveFleetMap')}</h2>
            {activeTrips.length > 0 ? (
              <div className="h-80 rounded-lg overflow-hidden border border-gray-200">
                <MapContainer
                  center={
                    activeTrips[0]?.driver?.location?.latitude && activeTrips[0]?.driver?.location?.longitude
                      ? [activeTrips[0].driver.location.latitude, activeTrips[0].driver.location.longitude]
                      : [14.695, -17.444] // default Senegal center
                  }
                  zoom={12}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {activeTrips.map((trip) => {
                    const driverLocation = trip.driver?.location
                    if (!driverLocation?.latitude || !driverLocation?.longitude) return null

                    return (
                      <Marker
                        key={`driver-${trip.id}`}
                        position={[driverLocation.latitude, driverLocation.longitude]}
                        icon={DriverMarkerIcon}
                      >
                        <Popup>
                          <div className="text-sm">
                            {/* CHANGE THIS LINE BELOW: Use trip.driver.name */}
                            <strong>{t('admin.driver')}</strong>: {trip.driver?.name || t('admin.unknown')}<br />
                            <strong>{t('admin.tripId')}</strong>: #{trip.id}<br />
                            <strong>{t('common.status')}</strong>: {getStatusLabel(trip.status)}
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              </div>
            ) : (
              <p className="text-gray-500">{t('admin.noActiveTripsMap')}</p>
            )}
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter className="w-5 h-5 text-gray-600" />
              <h2 className="font-bold text-gray-900">{t('admin.filterByStatus')}</h2>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'scheduled', 'assigned', 'started', 'completed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(status)
                    setPagination(prev => ({ ...prev, offset: 0 }))
                  }}
                >
                  {getStatusLabel(status)}
                </Button>
              ))}
            </div>
          </div>

          {/* Trips Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {activeTrips.length === 0 ? (
              <div className="p-8 text-center">
                <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('admin.noActiveTrips')}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.tripId')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('common.status')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.route')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.client')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.driver')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.distance')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.fare')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.duration')}</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">{t('admin.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeTrips.map(trip => (
                        <tr key={trip.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-medium text-gray-900">#{trip.id}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(trip.createdAt).toLocaleTimeString()}
                            </p>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                              {getStatusIcon(trip.status)} {getStatusLabel(trip.status)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900 truncate max-w-xs">
                                {trip.pickupAddress}
                              </p>
                              <p className="text-gray-500 truncate max-w-xs">
                                → {trip.dropoffAddress}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{trip.client?.name || 'Unknown'}</p>
                              <p className="text-gray-500">{Number(trip.client?.rating || 0).toFixed(1)} ⭐</p>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {trip.driver ? (
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{trip.driver.name}</p>
                                <p className={`text-xs ${trip.driver.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                                  {trip.driver.isOnline ? `🟢 ${t('admin.online')}` : `⚫ ${t('admin.offline')}`}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">{t('admin.waiting')}</p>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{trip.distance} km</p>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-gray-900">${Number(trip.totalPrice || 0).toFixed(2)}</p>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-gray-600">{trip.duration} min</p>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleViewTrip(trip.id)}
                              title={t('common.viewDetails')}
                            >
                              <FiEye className="w-4 h-4" />
                              {t('admin.view')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {t('admin.showing')}{' '}
                    <span className="font-medium">
                      {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)}
                    </span>{' '}
                    {t('admin.of')} <span className="font-medium">{pagination.total}</span> {t('admin.trips')}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          offset: Math.max(0, prev.offset - prev.limit)
                        }))
                      }
                      disabled={pagination.offset === 0 || isApiLoading}
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      {t('admin.previous')}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          offset: prev.offset + prev.limit
                        }))
                      }
                      disabled={!pagination.hasMore || isApiLoading}
                    >
                      {t('common.next')}
                      <FiChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}