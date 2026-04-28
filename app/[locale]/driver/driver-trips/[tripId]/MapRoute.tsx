"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, AttributionControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers not showing up correctly in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to auto-zoom the map to fit both markers
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

interface MapRouteProps {
  pickup: [number, number];
  destination: [number, number];
}

export default function MapRoute({ pickup, destination }: MapRouteProps) {
  const [route, setRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!pickup || !destination) return;

    const fetchRoute = async () => {
      try {
        // Use your self-hosted URL from the .env file, with a fallback just in case
        const baseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org";
        
        // OSRM expects coordinates in [longitude, latitude] format
        const res = await fetch(`${baseUrl}/route/v1/driving/${pickup[1]},${pickup[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`);
        
        if (!res.ok) throw new Error("Failed to fetch route from OSRM");
        
        const data = await res.json();
        
        if (data.routes && data.routes[0]) {
          // Convert OSRM [lon, lat] back to Leaflet [lat, lon] for the Polyline
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setRoute(coords);
        }
      } catch (err) {
        console.error("Routing error:", err);
      }
    };

    fetchRoute();
  }, [pickup, destination]);

  const bounds = L.latLngBounds([pickup, destination]);

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-md z-0 relative border border-gray-200">
      <MapContainer attributionControl={false} bounds={bounds} style={{ height: '100%', width: '100%' }}>
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayer 
          url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} 
          attribution="&copy; Oniva Map"
        />
        <Marker position={pickup} />
        <Marker position={destination} />
        {route.length > 0 && <Polyline positions={route} color="#3B82F6" weight={5} opacity={0.8} />}
        <ChangeView bounds={bounds} />
      </MapContainer>
    </div>
  );
}