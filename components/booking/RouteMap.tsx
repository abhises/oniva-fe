'use client'

import React, { useRef, useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Location {
  address: string
  latitude: number
  longitude: number
}

interface Props {
  pickup: Location
  dropoff: Location
  onPickupChange: (loc: Location) => void
  onDropoffChange: (loc: Location) => void
}

function MapClickHandler({ onPickupChange, onDropoffChange, pickup, dropoff }: any) {
  useMapEvents({
    click(e) {
      const lat = e.latlng.lat
      const lng = e.latlng.lng

      // If pickup not set, set pickup, else dropoff
      if (!pickup.latitude || !pickup.longitude) {
        reverseGeocode(lat, lng, onPickupChange)
      } else if (!dropoff.latitude || !dropoff.longitude) {
        reverseGeocode(lat, lng, onDropoffChange)
      }
    },
  })
  return null
}

async function reverseGeocode(lat: number, lng: number, onChange: any) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
    const res = await fetch(
      `${baseUrl}/reverse?lat=${lat}&lon=${lng}&format=json`
    )
    const data = await res.json()
    onChange({
      address: data.display_name || 'Selected location',
      latitude: lat,
      longitude: lng,
    })
  } catch (err) {
    console.error('Geocoding error', err)
  }
}

export const RouteMap = ({ pickup, dropoff, onPickupChange, onDropoffChange }: Props) => {
  const mapRef = useRef<any>(null)
  const [route, setRoute] = useState<[number, number][]>([])

  // Update route line when pickup or dropoff changes
  useEffect(() => {
    if (pickup.latitude && dropoff.latitude) {
      setRoute([
        [pickup.latitude, pickup.longitude],
        [dropoff.latitude, dropoff.longitude],
      ])
      if (mapRef.current) {
        mapRef.current.fitBounds([
          [pickup.latitude, pickup.longitude],
          [dropoff.latitude, dropoff.longitude],
        ], { padding: [50, 50] })
      }
    }
  }, [pickup, dropoff])

  return (
    <div style={{ height: '400px', width: '100%', marginBottom: '1rem' }}>
      <MapContainer
        center={[14.7167, -17.4677]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler
          onPickupChange={onPickupChange}
          onDropoffChange={onDropoffChange}
          pickup={pickup}
          dropoff={dropoff}
        />

        {pickup.latitude && pickup.longitude && (
          <Marker position={[pickup.latitude, pickup.longitude]} />
        )}

        {dropoff.latitude && dropoff.longitude && (
          <Marker position={[dropoff.latitude, dropoff.longitude]} />
        )}

        {route.length > 1 && <Polyline positions={route} color="blue" />}
      </MapContainer>
    </div>
  )
}
