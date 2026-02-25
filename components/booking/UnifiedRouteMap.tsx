"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
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
}

const MapBoundsFitter = ({ pickup, dropoff }: UnifiedRouteMapProps) => {
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

export default function UnifiedRouteMap({ pickup, dropoff, routeGeometry }: UnifiedRouteMapProps) {
  const defaultCenter: [number, number] = [14.7167, -17.4677]; // Dakar
  
  // OSRM returns [Longitude, Latitude], Leaflet needs [Latitude, Longitude]
  const leafletPath = routeGeometry?.map(coord => [coord[1], coord[0]] as [number, number]);

  return (
    <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden shadow-md border border-gray-200 z-0 mb-6">
      <MapContainer center={defaultCenter} zoom={13} className="w-full h-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pickup?.latitude ? <Marker position={[pickup.latitude, pickup.longitude]} /> : null}
        {dropoff?.latitude ? <Marker position={[dropoff.latitude, dropoff.longitude]} /> : null}
        {leafletPath && <Polyline positions={leafletPath} color="#2563eb" weight={5} opacity={0.8} />}
        <MapBoundsFitter pickup={pickup} dropoff={dropoff} routeGeometry={routeGeometry} />
      </MapContainer>
    </div>
  );
}