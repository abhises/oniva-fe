"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import { Car, MapPinCheckInside } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import "leaflet/dist/leaflet.css";

const center: LatLngExpression = [14.7167, -17.4677];
const bounds: LatLngBoundsExpression = [
  [14.6, -17.55],
  [14.85, -17.35],
];

const pinCheckMarker = L.divIcon({
  html: renderToStaticMarkup(
    <MapPinCheckInside stroke="blue" fill="blue" size={32} />,
  ),
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const carIcon = L.divIcon({
  html: renderToStaticMarkup(<Car color="red" fill="red" size={40} />),
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const route: LatLngExpression[] = [
  [14.7167, -17.4677],
  [14.7175, -17.4665],
  [14.7185, -17.4652],
  [14.7195, -17.464],
  [14.7205, -17.463],
  [14.7215, -17.462],
  [14.7225, -17.461],
  [14.7235, -17.46],
  [14.7245, -17.459],
  [14.7255, -17.458],
  [14.7265, -17.457],
  [14.7275, -17.456],
  [14.7285, -17.455],
  [14.7295, -17.454],
  [14.7305, -17.453],
  [14.7315, -17.452],
  [14.7325, -17.451],
  [14.7167, -17.4677],
  [14.718, -17.471],
  [14.719, -17.474],
  [14.7205, -17.476],
  [14.722, -17.478],
  [14.7235, -17.4745],
  [14.724, -17.4715],
  [14.7245, -17.4685],
  [14.725, -17.4655],
  [14.7265, -17.462],
  [14.728, -17.4605],
  [14.73, -17.459],
  [14.732, -17.4575],
  [14.734, -17.456],
  [14.7442, -17.5121],
  [14.744, -17.51],
  [14.7435, -17.508],
  [14.7425, -17.5065],
  [14.741, -17.5055],
  [14.74, -17.504],
  [14.7385, -17.502],
  [14.737, -17.5],
  [14.735, -17.498],
  [14.7325, -17.496],
  [14.73, -17.4935],
  [14.7275, -17.4915],
  [14.725, -17.489],
  [14.722, -17.487],
  [14.718, -17.484],
  [14.714, -17.4825],
  [14.71, -17.481],
  [14.705, -17.4795],
  [14.7, -17.478],
  [14.696, -17.476],
  [14.692, -17.474],
  [14.688, -17.4715],
  [14.685, -17.469],
  [14.684, -17.465],
  [14.6835, -17.462],
  [14.683, -17.459],
  [14.6825, -17.456],
  [14.6823, -17.453],
  [14.6822, -17.451],
];

function FlyToDakar() {
  const map = useMap();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const tryFly = () => {
      try {
        const size = map.getSize();
        if (size.x > 0 && size.y > 0) {
          map.invalidateSize();
          map.flyTo(center, 13, { duration: 2 });
        } else {
          timeout = setTimeout(tryFly, 100);
        }
      } catch (e) {
        // map already destroyed, ignore
      }
    };

    timeout = setTimeout(tryFly, 150);

    return () => {
      clearTimeout(timeout);
      try {
        map.stop(); // cancel in-progress animation
      } catch (e) {
        // map panes already removed during language switch unmount, ignore
      }
    };
  }, [map]);

  return null;
}

export default function SenegalMap() {
  const numCars = 3;
  const [positions, setPositions] = useState<number[]>(
    Array.from({ length: numCars }, (_, i) => i * 5),
  );
  const [directions, setDirections] = useState<number[]>(
    Array(numCars).fill(1),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos, i) => {
          let next = pos + directions[i];
          if (next >= route.length) {
            directions[i] = -1;
            next = pos - 1;
          } else if (next < 0) {
            directions[i] = 1;
            next = pos + 1;
          }
          return next;
        }),
      );
    }, 150);
    return () => clearInterval(interval);
  }, [directions]);

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

      <Marker position={center} icon={pinCheckMarker}>
        <Popup>Dakar</Popup>
      </Marker>

      {positions.map((posIndex, i) => (
        <Marker key={i} position={route[posIndex]} icon={carIcon}>
          <Popup>Car {i + 1}</Popup>
        </Marker>
      ))}

      <FlyToDakar />
    </MapContainer>
  );
}