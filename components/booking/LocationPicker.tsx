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

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 600);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearch.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setIsSearching(true);
      const results = await searchLocation(debouncedSearch);
      setSuggestions(results);
      setShowSuggestions(true);
      setIsSearching(false);
    };

    if (debouncedSearch !== value.address && debouncedSearch !== value.address.split(",")[0]) {
      fetchSuggestions();
    }
  }, [debouncedSearch, value.address]);

  const handleSearch = (val: string) => {
    setSearch(val);
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
      <div className="relative flex items-center group">
        <FiMapPin className="absolute left-5 text-gray-400 group-focus-within:text-primary transition-colors w-5 h-5" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => search.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`w-full pl-12 pr-12 py-4 bg-gray-50/50 rounded-[24px] outline-none font-bold text-gray-800 text-sm focus:bg-white focus:shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus:border-primary transition-all ${
            error ? "border-red-500 border-2" : "border-gray-100 border"
          }`}
        />
        {isSearching && (
          <div className="absolute right-5 text-gray-400 animate-spin">
            <FiLoader className="w-5 h-5" />
          </div>
        )}
        {search && !isSearching && (
          <button type="button" onClick={handleClear} className="absolute right-5 text-gray-400 hover:text-gray-600 transition bg-transparent border-none">
            <FiX className="w-5 h-5" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border border-white/40 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] mt-2 z-[1000] max-h-[300px] overflow-y-auto p-2">
          {suggestions.map((place, index) => {
            const name = place.display_name.split(",")[0];
            const region = place.display_name.split(",").slice(1, 4).join(",").trim();
            return (
              <button
                type="button"
                key={index}
                onClick={() => handleSelectSuggestion(place)}
                className="w-full px-4 py-3.5 text-left hover:bg-gray-50/80 rounded-[16px] transition flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-[12px] bg-gray-100/50 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <FiMapPin className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate text-sm">{name}</p>
                  <p className="text-[11px] font-medium text-gray-500 truncate mt-0.5">{region}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};