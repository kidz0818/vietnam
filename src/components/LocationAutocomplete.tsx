import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { searchVietnamLocations } from '../utils';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: { lat: number; lng: number; name: string; display_name: string }) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder, className, icon }: LocationAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value.trim() || value.length < 2) {
        setSuggestions([]);
        return;
      }
      setIsLoading(true);
      const results = await searchVietnamLocations(value);
      setSuggestions(results);
      setIsLoading(false);
    };

    const timeoutId = setTimeout(fetchSuggestions, 800);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className={`relative ${className || ''}`} ref={wrapperRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
        {icon || <Search size={18} />}
      </div>
      {isLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin" />}

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-xl shadow-lg overflow-hidden z-50 max-h-60 overflow-y-auto">
          {suggestions.map((loc, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onChange(loc.name);
                onSelect(loc);
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-50 last:border-0 flex items-start space-x-3"
            >
              <MapPin size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-stone-900">{loc.name}</div>
                <div className="text-xs text-stone-500 line-clamp-1">{loc.display_name}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
