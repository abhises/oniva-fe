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

const OSRM_API = 'https://router.project-osrm.org/route/v1/driving'

export async function calculateDistance(
  pickup: { latitude: number; longitude: number },
  dropoff: { latitude: number; longitude: number },
  rideType: 'economy' | 'premium' | 'comfort' = 'economy'
): Promise<DistanceResult | null> {
  try {
    // OSRM expects coordinates as [longitude, latitude]
    const coordinates = `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`

    const response = await fetch(
      `${OSRM_API}/${coordinates}?overview=full&geometries=geojson`
    )

    if (!response.ok) {
      throw new Error('OSRM request failed')
    }

    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes.length) {
      throw new Error('No route found')
    }

    const route = data.routes[0]
    const distanceInKm = route.distance / 1000
    const durationInMinutes = Math.ceil(route.duration / 60)

    // Pricing based on ride type
    const ratesByType = {
      economy: { baseFare: 2.5, perKmRate: 1.2, perMinRate: 0.3 },
      premium: { baseFare: 4.0, perKmRate: 1.8, perMinRate: 0.4 },
      comfort: { baseFare: 5.0, perKmRate: 2.2, perMinRate: 0.5 },
    }

    const rates = ratesByType[rideType]

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
    const coordinates = `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`

    const response = await fetch(
      `${OSRM_API}/${coordinates}?overview=full&geometries=geojson`
    )

    const data = await response.json()

    if (data.code !== 'Ok' || !data.routes.length) {
      return null
    }

    const route = data.routes[0]

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

