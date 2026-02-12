"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

const center: LatLngExpression = [14.7167, -17.4677];

const bounds: LatLngBoundsExpression = [
  [12.3, -17.7],
  [16.7, -11.3],
];

export default function SenegalMap() {
  return (
    <MapContainer
      center={center}
      zoom={7}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
    </MapContainer>
  );
}
