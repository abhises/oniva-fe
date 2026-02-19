"use client";

import { useState, useRef, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiMapPin, FiX, FiLoader } from "react-icons/fi";

interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface Props {
  value: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
  error?: string;
}

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function LocationMarker({ onChange, selectedLocation }: any) {
  const map = useMapEvents({
    click(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      // Reverse geocode
      reverseGeocode(lat, lng, onChange);
    },
  });

  return selectedLocation ? (
    <Marker position={[selectedLocation.latitude, selectedLocation.longitude]}>
      <Popup>{selectedLocation.address}</Popup>
    </Marker>
  ) : null;
}

async function reverseGeocode(lat: number, lng: number, onChange: any) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    );
    const data = await res.json();

    onChange({
      address: data.address?.name || data.display_name || "Selected location",
      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    console.error("Geocoding error:", error);
  }
}

async function searchLocation(query: string) {
  if (query.length < 2) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=sn&limit=8`,
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export const LocationPicker = ({
  value,
  onChange,
  placeholder = "Search location...",
  error,
}: Props) => {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Update form
    onChange({
      address: place.display_name,
      latitude: lat,
      longitude: lon,
    });

    // Update map view
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 15);
    }

    // Clear suggestions
    setSearch(place.display_name.split(",")[0]);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setSearch("");
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({ address: "", latitude: 0, longitude: 0 });
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
      {/* Search Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiMapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => search.length > 0 && setShowSuggestions(true)}
              placeholder={placeholder}
              className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                error ? "border-red-500" : "border-gray-300"
              }`}
            />

            {isSearching && (
              <div className="absolute right-3 top-3 text-gray-400 animate-spin">
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
        </div>

        {/* Suggestions Dropdown */}
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl mt-1 z-[1000] max-h-64 overflow-y-auto">
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
                  <FiMapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
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

      {/* Map */}
      <MapContainer
        center={[14.7167, -17.4677]} // Dakar
        zoom={12}
        style={{ height: "350px", width: "100%", borderRadius: "8px" }}
        ref={mapRef}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationMarker onChange={onChange} selectedLocation={value} />
      </MapContainer>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Click on the map or search to select a location
      </p>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};
