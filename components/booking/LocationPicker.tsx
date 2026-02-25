"use client";

import { useState, useRef, useEffect } from "react";
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

async function searchLocation(query: string) {
  if (query.length < 2) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=sn&limit=8`
    );
    return await res.json();
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

export const LocationPicker = ({ value, onChange, placeholder = "Search location...", error }: Props) => {
  const [search, setSearch] = useState(value.address || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  // Keep input synced if value changes from outside
  useEffect(() => {
    if (value.address && value.address !== search) {
      setSearch(value.address);
    }
  }, [value.address]);

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
    onChange({ address: place.display_name, latitude: lat, longitude: lon });
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
    <div className="relative space-y-3" ref={inputRef}>
      <div className="relative flex items-center">
        <FiMapPin className="absolute left-3 text-gray-400 w-5 h-5" />
        <input
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
          <div className="absolute right-3 text-gray-400 animate-spin">
            <FiLoader className="w-5 h-5" />
          </div>
        )}
        {search && !isSearching && (
          <button onClick={handleClear} className="absolute right-3 text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-xl mt-1 z-[1000] max-h-64 overflow-y-auto">
          {suggestions.map((place, index) => {
            const name = place.display_name.split(",")[0];
            const region = place.display_name.split(",").slice(1, 3).join(",").trim();
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
    </div>
  );
};