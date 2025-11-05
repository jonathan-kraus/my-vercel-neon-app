'use client';

import { useState } from 'react';
import { getAvailableLocations, getActiveLocation, Location } from '@/app/utils/locations';

interface LocationSelectorProps {
  onLocationChange?: (location: Location) => void;
}

export default function LocationSelector({ onLocationChange }: LocationSelectorProps) {
  const [availableLocations] = useState<Location[]>(() => getAvailableLocations());
  const [activeLocation, setActiveLocation] = useState<Location | null>(() => getActiveLocation());

  const handleLocationSelect = (location: Location) => {
    setActiveLocation(location);
    onLocationChange?.(location);
    // In a real app, this would update user preferences or feature flags
    console.log(`Location changed to: ${location.displayName}`);
  };

  if (availableLocations.length <= 1) {
    return null; // Don't show selector if only one location is available
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Weather Location</h3>
      <div className="flex flex-wrap gap-2">
        {availableLocations.map((location) => (
          <button
            key={location.name}
            onClick={() => handleLocationSelect(location)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeLocation?.name === location.name
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {location.displayName}
          </button>
        ))}
      </div>
      {activeLocation && (
        <p className="text-xs text-gray-500 mt-1">
          Currently showing weather for {activeLocation.displayName}
        </p>
      )}
    </div>
  );
}
