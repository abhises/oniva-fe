"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import { Car, MapPinCheckInside } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";

// Center on Dakar
const center: LatLngExpression = [14.7167, -17.4677];
const bounds: LatLngBoundsExpression = [
  [14.6, -17.55],
  [14.85, -17.35],
];

// Check Pin marker
const pinCheckMarker = L.divIcon({
  html: renderToStaticMarkup(<MapPinCheckInside stroke="blue" fill="blue" size={32} />),
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Car icon
const carIcon = L.divIcon({
  html: renderToStaticMarkup(<Car color="red" fill="red" size={40} />),
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Route from Dakar to Bambilor
const route: LatLngExpression[] = [
  [14.7167, -17.4677], // Dakar
  [14.7175, -17.4665],
  [14.7185, -17.4652],
  [14.7195, -17.4640],
  [14.7205, -17.4630],
  [14.7215, -17.4620],
  [14.7225, -17.4610],
  [14.7235, -17.4600],
  [14.7245, -17.4590],
  [14.7255, -17.4580],
  [14.7265, -17.4570],
  [14.7275, -17.4560],
  [14.7285, -17.4550],
  [14.7295, -17.4540],
  [14.7305, -17.4530], // Bambilor
  [14.7167, -17.4677], // Dakar
  [14.7200, -17.4660],
  [14.7230, -17.4640],
  [14.7260, -17.4620],
  [14.7290, -17.4600],
  [14.7320, -17.4580],
  [14.7350, -17.4560],
  [14.7380, -17.4540],
  [14.7410, -17.4520],
  [14.7440, -17.4500],
  [14.7470, -17.4480],
  [14.7500, -17.4460],
  [14.7530, -17.4440],
  [14.7560, -17.4420],
  [14.7590, -17.4400],
  [14.7620, -17.4380],
  [14.7650, -17.4360],
  [14.7680, -17.4340],
  [14.7710, -17.4320],
  [14.7740, -17.4300],
  [14.7770, -17.4280],
  [14.7800, -17.4260],
  [14.7830, -17.4240],
  [14.7860, -17.4220],
  [14.7890, -17.4200],
  [14.7920, -17.4180],
 
];

function FlyToDakar() {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 2 });
  }, [map]);
  return null;
}

export default function SenegalMap() {
  const [carPosIndex, setCarPosIndex] = useState(0);

  // Animate car along the route and loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCarPosIndex((prev) => {
        if (prev < route.length - 1) return prev + 1;
        return 0; // loop back to start
      });
    }, 200); // speed: 200ms per step
    return () => clearInterval(interval);
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={13}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* Static check pin */}
      <Marker position={center} icon={pinCheckMarker}>
        <Popup>Dakar</Popup>
      </Marker>

      {/* Moving car */}
      <Marker position={route[carPosIndex]} icon={carIcon}>
        <Popup>Car moving to Bambilor</Popup>
      </Marker>

      <FlyToDakar />
    </MapContainer>
  );
}
