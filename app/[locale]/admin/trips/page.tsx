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
    total: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'assigned' | 'started'>('all')
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0,
    hasMore: false
  })

  const loadActiveTrips = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setIsLoading(true);
      
      const response = await request<AdminTripsResponse>(() => 
        apiClient.getAdminActiveTrips({
          status: statusFilter,
          limit: pagination.limit,
          offset: pagination.offset
        })
      );

      if (response && response.data) {
        setActiveTrips(response.data);
        if (response.stats) setStats(response.stats);
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            total: response.pagination.total,
            hasMore: response.pagination.hasMore
          }));
        }
      }
      
    } catch (error: any) {
      console.error('Error loading trips:', error);
      if (showSpinner) toast.error(t('admin.failedLoadTrips'));
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [statusFilter, pagination.limit, pagination.offset, request, t]);

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
      case 'assigned':  return 'bg-blue-100 text-blue-800'
      case 'started':   return 'bg-green-100 text-green-800'
      default:          return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return '📋'
      case 'assigned':  return '✅'
      case 'started':   return '🚗'
      default:          return '❓'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'all':       return t('common.all')
      case 'scheduled': return t('admin.scheduled')
      case 'assigned':  return t('admin.assigned')
      case 'started':   return t('admin.started')
      default:          return status.charAt(0).toUpperCase() + status.slice(1)
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">{t('admin.scheduled')}</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.scheduled || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">{t('admin.assigned')}</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.assigned || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">{t('admin.inProgress')}</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats?.started || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">{t('admin.total')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter className="w-5 h-5 text-gray-600" />
              <h2 className="font-bold text-gray-900">{t('admin.filterByStatus')}</h2>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'scheduled', 'assigned', 'started'] as const).map((status) => (
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
                              <p className="text-gray-500">{trip.client?.rating?.toFixed(1) || '0.0'} ⭐</p>
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
                            <p className="text-sm font-bold text-gray-900">${trip.totalPrice?.toFixed(2)}</p>
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