export interface OSRMRoute {
  distance: number // in meters
  duration: number // in seconds
  coordinates: [number, number][]
}

export interface DistanceResult {
  distance: number // in km
  duration: number // in minutes
  estimatedFare: number
  baseFare: number
  perKmRate: number
  perMinRate: number
}

const getOsrmBaseUrl = () => process.env.NEXT_PUBLIC_OSRM_URL || 'https://router.project-osrm.org';

export async function calculateDistance(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number },
  bookingType: 'point-to-point' | 'hourly' = 'point-to-point'
): Promise<DistanceResult | null> {
  try {
    const baseUrl = getOsrmBaseUrl();
    // OSRM expects coordinates as [longitude, latitude]
    const coordinates = `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`

    const response = await fetch(
      `${baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=true`
    )

    if (!response.ok) {
      throw new Error('OSRM request failed')
    }

    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes.length) {
      throw new Error('No route found')
    }

    // Pick the shortest distance route among alternatives
    const sortedRoutes = [...data.routes].sort((a, b) => a.distance - b.distance);
    const route = sortedRoutes[0];
    
    const distanceInKm = route.distance / 1000
    const durationInMinutes = Math.ceil(route.duration / 60)

    // Pricing based on booking type
    const ratesByType = {
      'point-to-point': {
        baseFare: 2.5,    // $2.50 base
        perKmRate: 1.2,   // $1.20 per km
        perMinRate: 0.3,  // $0.30 per minute
      },
      'hourly': {
        baseFare: 15.0,   // $15 per hour
        perKmRate: 0.8,   // $0.80 per km
        perMinRate: 0.25, // $0.25 per minute
      },
    }

    const rates = ratesByType[bookingType]

    const estimatedFare = +(
      rates.baseFare +
      distanceInKm * rates.perKmRate +
      durationInMinutes * rates.perMinRate
    ).toFixed(2)

    return {
      distance: parseFloat(distanceInKm.toFixed(2)),
      duration: durationInMinutes,
      estimatedFare,
      baseFare: rates.baseFare,
      perKmRate: rates.perKmRate,
      perMinRate: rates.perMinRate,
    }
  } catch (error) {
    console.error('Distance calculation error:', error)
    return null
  }
}

// Alternative: Get full route details including coordinates
export async function getRouteDetails(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number }
): Promise<OSRMRoute | null> {
  try {
    const baseUrl = getOsrmBaseUrl();
    const coordinates = `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`

    const response = await fetch(
      `${baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&alternatives=true`
    )

    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes.length) {
      return null
    }

    // Pick the shortest distance route among alternatives
    const sortedRoutes = [...data.routes].sort((a, b) => a.distance - b.distance);
    const route = sortedRoutes[0];

    return {
      distance: route.distance,
      duration: route.duration,
      coordinates: route.geometry.coordinates,
    }
  } catch (error) {
    console.error('Route details error:', error)
    return null
  }
}