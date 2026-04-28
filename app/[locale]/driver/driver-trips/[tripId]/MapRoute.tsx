"use client";

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, AttributionControl, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A custom highly visible marker for the driver's live GPS location
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
  isNavigating?: boolean;
  tripStatus?: string;
  onLocationUpdate?: (lat: number, lng: number) => void;
}

// Map sub-component to auto-zoom or lock onto driver dynamically
function NavigationController({ bounds, driverLocation, isNavigating }: any) {
  const map = useMap();
  useEffect(() => {
    if (isNavigating && driverLocation) {
      // Lock camera to driver's moving location and zoom in tight
      map.setView(driverLocation, 17, { animate: true, duration: 1 });
    } else if (!isNavigating && bounds) {
      // Show full trip overview
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, driverLocation, isNavigating, map]);
  return null;
}

export default function MapRoute({ pickup, destination, pickupAddress, destinationAddress, isNavigating, tripStatus, onLocationUpdate }: MapRouteProps) {
  const [tripRoute, setTripRoute] = useState<[number, number][]>([]);
  const [driverRoute, setDriverRoute] = useState<[number, number][]>([]);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const lastRoutedDriverPos = useRef<string | null>(null);

  // 1. Live GPS Tracking
  useEffect(() => {
    let watchId: number;
    if (isNavigating && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setDriverLocation([lat, lng]);
          if (onLocationUpdate) onLocationUpdate(lat, lng);
        },
        (err) => {
          console.warn("GPS gracefully waiting:", err.message || "No GPS signal");
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else {
      setDriverLocation(null);
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isNavigating]);

  // 2. Static Overview Route (Always visible: Pickup -> Destination)
  useEffect(() => {
    if (!pickup || !destination) return;
    
    const fetchTripRoute = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_OSRM_URL || "https://router.project-osrm.org";
        const res = await fetch(`${baseUrl}/route/v1/driving/${pickup[1]},${pickup[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`);
        if (!res.ok) throw new Error("Failed to fetch route from OSRM");
        
        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setTripRoute(coords);
        }
      } catch (err) {
        console.error("Routing error:", err);
      }
    };
    fetchTripRoute();
  }, [pickup, destination]);

  // 3. Dynamic Driver Route (Driver -> Active Target)
  useEffect(() => {
    if (!isNavigating || !driverLocation) {
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
  }, [isNavigating, driverLocation, pickup, destination, tripStatus]);

  const overviewBounds = L.latLngBounds([pickup, destination]);

  return (
    <div className={`w-full rounded-xl overflow-hidden shadow-md z-0 relative border border-gray-200 transition-all duration-500 ${isNavigating ? 'h-[60vh] ring-4 ring-primary ring-opacity-50' : 'h-[300px]'}`}>
      <MapContainer attributionControl={false} bounds={overviewBounds} style={{ height: '100%', width: '100%' }}>
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayer 
          url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} 
          attribution="&copy; Oniva Map"
        />
        
        {/* The Live Driver GPS Blip */}
        {driverLocation && <Marker position={driverLocation} icon={driverIcon} />}
        
        {/* The Trip Points */}
        <Marker position={pickup}>
          {pickupAddress && <Popup><strong>Pickup:</strong><br />{pickupAddress}</Popup>}
        </Marker>
        <Marker position={destination}>
          {destinationAddress && <Popup><strong>Destination:</strong><br />{destinationAddress}</Popup>}
        </Marker>
        
        {/* The Static Trip Route (Always Visible) */}
        {tripRoute.length > 0 && (
          <Polyline 
            positions={tripRoute} 
            color="#3B82F6" // Always solid Blue
            weight={6} 
            opacity={0.7} 
          />
        )}
        
        {/* The Dynamic Driver Route (Visible Only When Navigating) */}
        {driverRoute.length > 0 && (
          <Polyline 
            positions={driverRoute} 
            color="#DC2626" // Vibrant Red for live tracking
            weight={7} 
            opacity={1} 
          />
        )}
        
        {/* Camera Logic */}
        <NavigationController bounds={overviewBounds} driverLocation={driverLocation} isNavigating={isNavigating} />
      </MapContainer>
    </div>
  );
}