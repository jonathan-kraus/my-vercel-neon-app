'use client';

import { Location } from '@/app/utils/locations';

interface LocationMapProps {
  location: Location;
}

export default function LocationMap({ location }: LocationMapProps) {
  // OpenStreetMap embed URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.lon - 0.05},${location.lat - 0.05},${location.lon + 0.05},${location.lat + 0.05}&layer=mapnik&marker=${location.lat},${location.lon}`;

  // Google Maps link for opening in new tab
  const googleMapsUrl = `https://www.google.com/maps?q=${location.lat},${location.lon}`;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-linear-to-r from-blue-500 to-indigo-600 text-white">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {location.displayName}
        </h3>
        <p className="text-sm text-blue-100 mt-1">
          {location.lat.toFixed(4)}°N, {Math.abs(location.lon).toFixed(4)}°W
        </p>
      </div>

      <div className="relative">
        <iframe
          width="100%"
          height="300"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          className="border-0"
          title={`Map of ${location.displayName}`}
        />
        <div className="absolute bottom-2 right-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-medium shadow-lg hover:bg-blue-50 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open in Maps
          </a>
        </div>
      </div>
    </div>
  );
}
