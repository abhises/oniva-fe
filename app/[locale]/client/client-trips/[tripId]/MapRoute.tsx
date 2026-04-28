"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, AttributionControl, Popup } from 'react-leaflet';
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

// Custom driver icon marker
const driverHtml = `
  <div style="background-color: white; width: 36px; height: 36px; border-radius: 50%; border: 3px solid #10B981; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 20px;">
    🚘
  </div>
`;
const driverIcon = L.divIcon({
  html: driverHtml,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapRouteProps {
  pickup: [number, number];
  destination: [number, number];
  pickupAddress?: string;
  destinationAddress?: string;
  driverLocation?: [number, number];
  tripStatus?: string;
}

export default function MapRoute({ pickup, destination, pickupAddress, destinationAddress, driverLocation, tripStatus }: MapRouteProps) {
  const [route, setRoute] = useState<[number, number][]>([]);
  const [driverRoute, setDriverRoute] = useState<[number, number][]>([]);
  const lastRoutedDriverPos = useRef<string | null>(null);

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

  // 2. Dynamic Driver Route (Driver -> Active Target)
  useEffect(() => {
    if (!driverLocation) {
       setDriverRoute([]);
       lastRoutedDriverPos.current = null;
       return;
    }

    // If trip hasn't started, navigate to pickup, else destination
    const target = (tripStatus === 'accepted' || tripStatus === 'scheduled') ? pickup : destination;

    // Hash the coordinate roughly to avoid spamming the OSRM API if the driver only moved 5 meters
    const originHash = `${driverLocation[0].toFixed(3)},${driverLocation[1].toFixed(3)}`;
    const targetHash = `${target[0].toFixed(3)},${target[1].toFixed(3)}`;
    const routeKey = `${originHash}-${targetHash}`;

    if (lastRoutedDriverPos.current === routeKey) return; 

    const fetchDriverRoute = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org";
        const res = await fetch(`${baseUrl}/route/v1/driving/${driverLocation[1]},${driverLocation[0]};${target[1]},${target[0]}?overview=full&geometries=geojson`);
        if (!res.ok) throw new Error("Failed to fetch driver route");
        
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setDriverRoute(coords);
          lastRoutedDriverPos.current = routeKey;
        }
      } catch (err) {
        console.error("Driver routing error:", err);
      }
    };

    fetchDriverRoute();
  }, [driverLocation, pickup, destination, tripStatus]);

  const bounds = L.latLngBounds([pickup, destination]);

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden shadow-md z-0 relative border border-gray-200">
      <MapContainer attributionControl={false} bounds={bounds} style={{ height: '100%', width: '100%' }}>
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayer 
          url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} 
          attribution="&copy; Oniva Map"
        />
        <Marker position={pickup}>
          {pickupAddress && <Popup><strong>Pickup:</strong><br />{pickupAddress}</Popup>}
        </Marker>
        <Marker position={destination}>
          {destinationAddress && <Popup><strong>Destination:</strong><br />{destinationAddress}</Popup>}
        </Marker>
        
        {driverLocation && <Marker position={driverLocation} icon={driverIcon} />}
        
        {/* The Static Trip Route (Always Visible) */}
        {route.length > 0 && <Polyline positions={route} color="#3B82F6" weight={6} opacity={0.7} />}

        {/* The Dynamic Driver Route (Visible Only When Driver is Active) */}
        {driverRoute.length > 0 && (
          <Polyline 
            positions={driverRoute} 
            color="#DC2626" // Vibrant Red for live tracking
            weight={7} 
            opacity={1} 
          />
        )}
        
        <ChangeView bounds={bounds} />
      </MapContainer>
    </div>
  );
}