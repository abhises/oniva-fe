"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents, AttributionControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Location {
  latitude: number;
  longitude: number;
}

interface UnifiedRouteMapProps {
  pickup: Location | null;
  dropoff: Location | null;
  routeGeometry: [number, number][] | null; 
  onMapClick?: (lat: number, lng: number) => void;
}

const MapBoundsFitter = ({ pickup, dropoff }: { pickup: Location | null; dropoff: Location | null }) => {
  const map = useMap();
  useEffect(() => {
    if (pickup?.latitude && dropoff?.latitude) {
      const bounds = L.latLngBounds(
        [pickup.latitude, pickup.longitude],
        [dropoff.latitude, dropoff.longitude]
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup?.latitude) {
      map.setView([pickup.latitude, pickup.longitude], 14);
    }
  }, [map, pickup, dropoff]);
  return null;
};

const MapClickHandler = ({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};

export default function UnifiedRouteMap({ pickup, dropoff, routeGeometry, onMapClick }: UnifiedRouteMapProps) {
  const defaultCenter: [number, number] = [14.7167, -17.4677]; // Dakar
  
  // OSRM returns [Longitude, Latitude], Leaflet needs [Latitude, Longitude]
  const leafletPath = routeGeometry?.map(coord => [coord[1], coord[0]] as [number, number]);

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer attributionControl={false} center={defaultCenter} zoom={13} className="w-full h-full">
        <AttributionControl position="bottomright" prefix={false} />
        <TileLayer 
          url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"} 
          attribution="&copy; Oniva Map"
        />
        {pickup?.latitude ? <Marker position={[pickup.latitude, pickup.longitude]} /> : null}
        {dropoff?.latitude ? <Marker position={[dropoff.latitude, dropoff.longitude]} /> : null}
        {leafletPath && <Polyline positions={leafletPath} color="#2563eb" weight={5} opacity={0.8} />}
        <MapBoundsFitter pickup={pickup} dropoff={dropoff} />
        <MapClickHandler onMapClick={onMapClick} />
      </MapContainer>
      
      {/* Selection Mode Indicator */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-primary/90 backdrop-blur-md py-2 px-4 rounded-full shadow-lg border border-white/20 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {pickup?.latitude && dropoff?.latitude ? "Adjusting Locations" : (pickup?.latitude ? "Select Destination" : "Select Pickup")}
          </span>
        </div>
      </div>
    </div>
  );
}