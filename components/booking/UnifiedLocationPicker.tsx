"use client";

import { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiMapPin, FiX, FiLoader, FiArrowRight } from "react-icons/fi";

interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface Props {
  pickupLocation: Location;
  dropoffLocation: Location;
  onPickupChange: (location: Location) => void;
  onDropoffChange: (location: Location) => void;
  pickupError?: string;
  dropoffError?: string;
}

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom icons for pickup and dropoff
const pickupIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapMarkers({ pickupLocation, dropoffLocation }: any) {
  useMapEvents({});

  return (
    <>
      {pickupLocation.latitude && pickupLocation.longitude && (
        <Marker
          position={[pickupLocation.latitude, pickupLocation.longitude]}
          icon={pickupIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-blue-600">Pickup</p>
              <p className="text-gray-700">{pickupLocation.address}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {dropoffLocation.latitude && dropoffLocation.longitude && (
        <Marker
          position={[dropoffLocation.latitude, dropoffLocation.longitude]}
          icon={dropoffIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold text-red-600">Dropoff</p>
              <p className="text-gray-700">{dropoffLocation.address}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {pickupLocation.latitude &&
        pickupLocation.longitude &&
        dropoffLocation.latitude &&
        dropoffLocation.longitude && (
          <Polyline
            positions={[
              [pickupLocation.latitude, pickupLocation.longitude],
              [dropoffLocation.latitude, dropoffLocation.longitude],
            ]}
            color="blue"
            weight={3}
            opacity={0.7}
            dashArray="5, 5"
          />
        )}
    </>
  );
}

async function reverseGeocode(lat: number, lng: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
    const res = await fetch(
      `${baseUrl}/reverse?lat=${lat}&lon=${lng}&format=json`,
    );
    const data = await res.json();
    return data.display_name || "Selected location";
  } catch (error) {
    console.error("Geocoding error:", error);
    return "Selected location";
  }
}

async function searchLocation(query: string) {
  if (query.length < 2) return [];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_GEOCODING_URL || "https://abhises-oniva-osm-search.hf.space";
    const res = await fetch(
      `${baseUrl}/search?format=json&q=${query}&limit=8`,
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export const UnifiedLocationPicker = ({
  pickupLocation,
  dropoffLocation,
  onPickupChange,
  onDropoffChange,
  pickupError,
  dropoffError,
}: Props) => {
  const [activeLocation, setActiveLocation] = useState<"pickup" | "dropoff">(
    "pickup",
  );
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function MapClickHandler({
    onClick,
  }: {
    onClick: (e: L.LeafletMouseEvent) => void;
  }) {
    useMapEvents({
      click(e) {
        onClick(e);
      },
    });
    return null;
  }

  // Get current location data based on active location
  const currentLocation =
    activeLocation === "pickup" ? pickupLocation : dropoffLocation;
  const currentError = activeLocation === "pickup" ? pickupError : dropoffError;

  const handleSearch = async (val: string) => {
    setSearch(val);

    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    const results = await searchLocation(val);
    setSuggestions(results);
    setShowSuggestions(true);
    setIsSearching(false);
  };

  const handleSelectSuggestion = (place: any) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);

    const locationData = {
      address: place.display_name,
      latitude: lat,
      longitude: lon,
    };

    // Update appropriate location
    if (activeLocation === "pickup") {
      onPickupChange(locationData);
    } else {
      onDropoffChange(locationData);
    }

    // Update map view to show both markers if both are set
    if (mapRef.current) {
      if (
        activeLocation === "pickup" &&
        dropoffLocation.latitude &&
        dropoffLocation.longitude
      ) {
        // Fit both markers
        const bounds = L.latLngBounds([
          [lat, lon],
          [dropoffLocation.latitude, dropoffLocation.longitude],
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else if (activeLocation === "dropoff") {
        const bounds = L.latLngBounds([
          [pickupLocation.latitude, pickupLocation.longitude],
          [lat, lon],
        ]);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapRef.current.setView([lat, lon], 15);
      }
    }

    // Clear suggestions
    setSearch(place.display_name.split(",")[0]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleMapClick = async (e: any) => {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    const address = await reverseGeocode(lat, lng);

    const locationData = {
      address,
      latitude: lat,
      longitude: lng,
    };

    if (activeLocation === "pickup") {
      onPickupChange(locationData);
    } else {
      onDropoffChange(locationData);
    }

    setSearch(address.split(",")[0]);
  };

  const handleClear = () => {
    setSearch("");
    setSuggestions([]);
    setShowSuggestions(false);

    if (activeLocation === "pickup") {
      onPickupChange({ address: "", latitude: 0, longitude: 0 });
    } else {
      onDropoffChange({ address: "", latitude: 0, longitude: 0 });
    }
  };

  const handleToggleLocation = (location: "pickup" | "dropoff") => {
    setActiveLocation(location);
    setSearch(
      location === "pickup"
        ? pickupLocation.address.split(",")[0]
        : dropoffLocation.address.split(",")[0],
    );
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3">
      {/* Location Toggle Tabs */}
      <div className="flex gap-2 border-b border-gray-300">
        <button
          onClick={() => handleToggleLocation("pickup")}
          className={`flex-1 py-3 font-medium transition flex items-center justify-center gap-2 ${
            activeLocation === "pickup"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FiMapPin className="w-4 h-4 text-blue-600" />
          Pickup
        </button>
        <button
          onClick={() => handleToggleLocation("dropoff")}
          className={`flex-1 py-3 font-medium transition flex items-center justify-center gap-2 ${
            activeLocation === "dropoff"
              ? "border-b-2 border-red-600 text-red-600"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FiMapPin className="w-4 h-4 text-red-600" />
          Dropoff
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <FiMapPin
            className={`absolute left-3 top-3 w-5 h-5 ${
              activeLocation === "pickup" ? "text-blue-400" : "text-red-400"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => search.length > 0 && setShowSuggestions(true)}
            placeholder={
              activeLocation === "pickup"
                ? "Search pickup location..."
                : "Search dropoff location..."
            }
            className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              currentError
                ? "border-red-500 focus:ring-red-500"
                : `border-gray-300 focus:ring-${
                    activeLocation === "pickup" ? "blue" : "red"
                  }-500`
            }`}
          />

          {isSearching && (
            <div
              className={`absolute right-3 top-3 animate-spin ${
                activeLocation === "pickup" ? "text-blue-400" : "text-red-400"
              }`}
            >
              <FiLoader className="w-5 h-5" />
            </div>
          )}

          {search && !isSearching && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl mt-1 z-50 max-h-64 overflow-y-auto">
            {suggestions.map((place, index) => {
              const name = place.display_name.split(",")[0];
              const region = place.display_name
                .split(",")
                .slice(1, 3)
                .join(",")
                .trim();

              return (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(place)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b last:border-b-0 transition flex items-start gap-3"
                >
                  <FiMapPin
                    className={`w-4 h-4 mt-1 flex-shrink-0 ${
                      activeLocation === "pickup"
                        ? "text-blue-400"
                        : "text-red-400"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{region}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showSuggestions &&
          suggestions.length === 0 &&
          search.length > 2 &&
          !isSearching && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl mt-1 z-50 p-4">
              <p className="text-sm text-gray-500 text-center">
                No locations found
              </p>
            </div>
          )}
      </div>

      {/* Map - Click to select locations */}
      <MapContainer
        center={[14.7167, -17.4677]} // Dakar
        zoom={12}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "8px",
          border: "2px solid #e5e7eb",
        }}
        ref={mapRef}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Handle map clicks */}
        <MapClickHandler onClick={handleMapClick} />

        <MapMarkers
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
        />
      </MapContainer>

      {/* Selected Locations Display */}
      <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
        {/* Pickup Display */}
        <div className="flex items-start gap-2">
          <FiMapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600">Pickup</p>
            <p className="text-sm text-gray-900">
              {pickupLocation.address || "Not selected"}
            </p>
          </div>
        </div>

        {/* Arrow */}
        {pickupLocation.latitude && dropoffLocation.latitude && (
          <div className="flex items-center justify-center">
            <FiArrowRight className="w-4 h-4 text-gray-400 rotate-90" />
          </div>
        )}

        {/* Dropoff Display */}
        <div className="flex items-start gap-2">
          <FiMapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-600">Dropoff</p>
            <p className="text-sm text-gray-900">
              {dropoffLocation.address || "Not selected"}
            </p>
          </div>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Click on the map or search to select locations. Route will show when
        both locations are selected.
      </p>

      {/* Errors */}
      {pickupError && <p className="text-red-500 text-sm">{pickupError}</p>}
      {dropoffError && <p className="text-red-500 text-sm">{dropoffError}</p>}
    </div>
  );
};
