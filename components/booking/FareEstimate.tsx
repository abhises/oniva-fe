'use client'

import React from 'react'
import { FiClock, FiNavigation, FiMoon, FiTrendingUp } from 'react-icons/fi'

interface FareEstimateProps {
  estimate: any
  bookingType: 'point-to-point' | 'hourly'
  passengers: number
  isLoading: boolean
}

export const FareEstimate: React.FC<FareEstimateProps> = ({
  estimate,
  bookingType,
  passengers,
  isLoading,
}) => {
  if (!estimate && !isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Fare Estimate</h3>
        <p className="text-gray-500 text-sm">
          Get a fare estimate by selecting your locations and clicking the estimate button.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sticky top-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Fare Estimate</h3>

      <div className="space-y-4">
        {/* Base Fare */}
        <div className="flex justify-between items-center pb-4 border-b">
          <span className="text-gray-600">Base Fare</span>
          <span className="font-semibold text-gray-900">
            {estimate?.baseFare?.toLocaleString()} FCFA
          </span>
        </div>

        {/* Distance Fee */}
        {estimate?.estimatedDistance && (
          <div className="flex justify-between items-center pb-4 border-b">
            <div className="flex items-center text-gray-600">
              <FiNavigation className="w-4 h-4 mr-2" />
              Distance Fee ({estimate.estimatedDistance} km)
            </div>
            <span className="font-semibold text-gray-900">
              {estimate?.distanceFee?.toLocaleString()} FCFA
            </span>
          </div>
        )}

        {/* Time Fee */}
        {estimate?.estimatedDuration && (
          <div className="flex justify-between items-center pb-4 border-b">
            <div className="flex items-center text-gray-600">
              <FiClock className="w-4 h-4 mr-2" />
              Time ({estimate.estimatedDuration} min)
            </div>
            <span className="font-semibold text-gray-900">
              {estimate?.timeFee?.toLocaleString()} FCFA
            </span>
          </div>
        )}

        {/* Night Surcharge */}
        {estimate?.nightSurcharge > 0 && (
          <div className="flex justify-between items-center pb-4 border-b text-indigo-600">
            <div className="flex items-center text-sm">
              <FiMoon className="w-4 h-4 mr-2" />
              Night Surcharge
            </div>
            <span className="font-semibold">
              +{estimate.nightSurcharge.toLocaleString()} FCFA
            </span>
          </div>
        )}

        {/* Long Distance Indicator */}
        {estimate?.isLongDistance && (
          <div className="flex items-center text-amber-700 text-xs bg-amber-50 p-2 rounded border border-amber-100">
            <FiTrendingUp className="w-4 h-4 mr-2" />
            Long distance coefficient applied
          </div>
        )}

        {/* Service Fee */}
        <div className="flex justify-between items-center pb-4 border-b">
          <span className="text-gray-600">Service Fee</span>
          <span className="font-semibold text-gray-900">
            {estimate?.serviceFee?.toFixed(2)} FCFA
          </span>
        </div>

        {/* Surge Pricing */}
        {estimate?.surgeFee > 0 && (
          <div className="flex justify-between items-center pb-4 border-b bg-orange-50 -mx-2 px-2 py-2 rounded">
            <span className="text-orange-700 font-medium">Surge Pricing</span>
            <span className="font-bold text-orange-700">
              {estimate?.surgeFee?.toFixed(2)} FCFA
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-between items-center pt-4 bg-blue-50 -mx-6 px-6 py-4 rounded-b-lg">
          <span className="text-lg font-bold text-gray-900">Total Estimate</span>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {estimate?.estimatedFare?.toLocaleString()} FCFA
            </div>
            {estimate?.minFare && estimate?.maxFare && (
              <p className="text-xs text-gray-600 mt-1">
                {estimate.minFare?.toLocaleString()} FCFA - {estimate.maxFare?.toLocaleString()} FCFA
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Booking Type</span>
            <span className="font-medium capitalize">{bookingType}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Passengers</span>
            <span className="font-medium">{passengers}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center pt-2">
          Final fare may vary based on actual route and traffic
        </p>
      </div>
    </div>
  )
}