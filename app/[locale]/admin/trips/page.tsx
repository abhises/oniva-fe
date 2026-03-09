'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/services/api'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import toast from 'react-hot-toast'
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

// 1. Added an interface for the API Response based on your backend structure
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

  useEffect(() => {
    loadActiveTrips()
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadActiveTrips, 10000)
    return () => clearInterval(interval)
  }, [statusFilter, pagination.offset])

  const loadActiveTrips = async () => {
    try {
      setIsLoading(true)

      // 2. Cast the response to the interface we created using `as AdminTripsResponse`
      const data = await request(async () => {
        return await apiClient.getAdminActiveTrips({
          limit: pagination.limit,
          offset: pagination.offset,
          status: statusFilter !== 'all' ? statusFilter : undefined
        })
      }) as AdminTripsResponse; 

      if (data) {
        setActiveTrips(data.data || [])
        setPagination({
          limit: data.pagination.limit,
          offset: data.pagination.offset,
          total: data.pagination.total,
          hasMore: data.pagination.hasMore
        })
        setStats(data.stats)
      }
    } catch (error: any) {
      console.error('Error loading trips:', error)
      toast.error('Failed to load trips')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-purple-100 text-purple-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'started':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '📋'
      case 'assigned':
        return '✅'
      case 'started':
        return '🚗'
      default:
        return '❓'
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
            <p className="text-gray-600">Loading active trips...</p>
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
            <button
              onClick={() => router.back()}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            <div className="flex items-center justify-between bg-white rounded-lg shadow-lg p-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Active Trips</h1>
                <p className="text-gray-600 mt-1">Real-time trip monitoring</p>
              </div>

              <button
                // onClick={loadActiveTrips}
                disabled={isApiLoading}
                className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                title="Refresh"
              >
                <FiRefreshCw className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats?.scheduled || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Assigned</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.assigned || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats?.started || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
            </div>
          </div>

          {/* Filter */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FiFilter className="w-5 h-5 text-gray-600" />
              <h2 className="font-bold text-gray-900">Filter by Status</h2>
            </div>

            <div className="flex gap-2 flex-wrap">
              {['all', 'scheduled', 'assigned', 'started'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status as any)
                    setPagination(prev => ({ ...prev, offset: 0 }))
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Trips Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {activeTrips.length === 0 ? (
              <div className="p-8 text-center">
                <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active trips</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Trip ID</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Route</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Client</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Driver</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Distance</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fare</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Duration</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
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
                              {getStatusIcon(trip.status)} {trip.status}
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
                                  {trip.driver.isOnline ? '🟢 Online' : '⚫ Offline'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Waiting...</p>
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
                            <button
                              onClick={() => handleViewTrip(trip.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                              title="View details"
                            >
                              <FiEye className="w-4 h-4" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing{' '}
                    <span className="font-medium">
                      {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> trips
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          offset: Math.max(0, prev.offset - prev.limit)
                        }))
                      }
                      disabled={pagination.offset === 0 || isApiLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </button>

                    <button
                      onClick={() =>
                        setPagination(prev => ({
                          ...prev,
                          offset: prev.offset + prev.limit
                        }))
                      }
                      disabled={!pagination.hasMore || isApiLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </button>
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