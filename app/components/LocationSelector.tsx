'use client';

import { useState, useEffect } from 'react';
import { getAvailableLocations, getActiveLocation, Location } from '@/app/utils/locations';

interface LocationSelectorProps {
  onLocationChange?: (location: Location) => void;
}

export default function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      console.log('LocationSelector: Fetching locations...');
      const locations = await getAvailableLocations();
      const active = await getActiveLocation();
      console.log('LocationSelector: Available locations:', locations);
      console.log('LocationSelector: Active location:', active);
      setAvailableLocations(locations);
      setActiveLocation(active);
      setLoading(false);
    })();
  }, []);

  const handleLocationSelect = (location: Location) => {
    setActiveLocation(location);
    onLocationChange?.(location);
    // In a real app, this would update user preferences or feature flags
    console.log(`Location changed to: ${location.displayName}`);
  };

  if (loading) {
    return <div className="mb-4 text-sm text-gray-600">Loading locations...</div>;
  }

  if (availableLocations.length <= 1) {
    // Show a message if no locations are available but we have a fallback
    if (availableLocations.length === 0 && activeLocation) {
      return (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Using fallback location ({activeLocation.displayName}). Enable
            location flags in{' '}
            <a href="/admin/feature-flags" className="underline">
              Feature Flags
            </a>{' '}
            to switch locations.
          </p>
        </div>
      );
    }
    return null; // Don't show selector if only one location is available
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <h3 className="text-base font-semibold text-gray-800">Weather Location</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableLocations.map((location) => (
          <button
            key={location.name}
            onClick={() => handleLocationSelect(location)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              activeLocation?.name === location.name
                ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-blue-300'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md'
            }`}
          >
            <span className="flex items-center gap-2">
              {location.flag && <span className="text-lg">{location.flag}</span>}
              <span>{location.displayName}</span>
              {activeLocation?.name === location.name && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
          </button>
        ))}
      </div>
      {activeLocation && (
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Currently showing weather for{' '}
          <span className="font-medium">{activeLocation.displayName}</span>
        </p>
      )}
    </div>
  );
}
