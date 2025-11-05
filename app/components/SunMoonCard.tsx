'use client';

import { DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { isFeatureEnabled } from '@/app/utils/featureFlags';
import { getActiveLocation } from '@/app/utils/locations';

interface SunMoonCardProps {
  forecast: DailyForecastPoint[];
}

export default function SunMoonCard({ forecast }: SunMoonCardProps) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-300 dark:border-gray-600">
        <p className="text-center text-gray-500">Loading celestial data...</p>
      </div>
    );
  }

  // Get today's forecast (first item)
  const today = forecast[0];

  // For testing - use mock data if API doesn't provide sunrise/sunset
  const mockSunrise = '2025-11-03T06:30:00Z';
  const mockSunset = '2025-11-03T17:45:00Z';
  const mockMoonrise = '2025-11-03T19:15:00Z';
  const mockMoonset = '2025-11-03T07:30:00Z';

  const sunriseTime = today.sunriseTime || mockSunrise;
  const sunsetTime = today.sunsetTime || mockSunset;
  const moonriseTime = today.moonriseTime || mockMoonrise;
  const moonsetTime = today.moonsetTime || mockMoonset;
  const now = new Date();
  const currentTime = now.getTime();

  // Helper function to check if a celestial body is currently up
  const isCurrentlyUp = (riseTime?: string, setTime?: string): boolean => {
    if (!riseTime || !setTime) return false;

    const rise = new Date(riseTime).getTime();
    const set = new Date(setTime).getTime();

    // Handle cases where set time is next day (after midnight)
    if (set < rise) {
      // Sun/moon sets next day, so it's up from rise until midnight, and from midnight until set
      return currentTime >= rise || currentTime <= set;
    } else {
      // Normal case: up between rise and set
      return currentTime >= rise && currentTime <= set;
    }
  };

  const sunIsUp = isCurrentlyUp(sunriseTime, sunsetTime);
  const moonIsUp = isCurrentlyUp(moonriseTime, moonsetTime);

  const formatTime = (timeString?: string): string => {
    if (!timeString) return 'N/A';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-linear-to-r from-yellow-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-4 border border-yellow-200 dark:border-gray-600">
      <h3 className="text-lg font-semibold mb-3 text-center">🌅 Sun & Moon Today</h3>

      {isFeatureEnabled('WEATHER_LOCATION_DISPLAY') && (
        <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-center text-blue-800">
          📍 Location: {getActiveLocation().displayName}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sun Section */}
        <div className="text-center">
          <div className={`text-4xl mb-2 ${sunIsUp ? 'animate-pulse' : 'opacity-50'}`}>
            {sunIsUp ? '☀️' : '🌙'}
          </div>
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Sun</h4>
          <div className="text-sm space-y-1 mt-2">
            <p className="flex justify-between">
              <span>Rise:</span>
              <span className="font-mono">{formatTime(sunriseTime)}</span>
            </p>
            <p className="flex justify-between">
              <span>Set:</span>
              <span className="font-mono">{formatTime(sunsetTime)}</span>
            </p>
          </div>
          <div
            className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
              sunIsUp
                ? 'bg-yellow-200 text-yellow-800'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
            }`}
          >
            {sunIsUp ? '☀️ Currently Up' : '🌙 Currently Down'}
          </div>
        </div>

        {/* Moon Section */}
        <div className="text-center">
          <div className={`text-4xl mb-2 ${moonIsUp ? 'animate-pulse' : 'opacity-50'}`}>
            {moonIsUp ? '🌕' : '🌑'}
          </div>
          <h4 className="font-medium text-blue-800 dark:text-blue-200">Moon</h4>
          <div className="text-sm space-y-1 mt-2">
            <p className="flex justify-between">
              <span>Rise:</span>
              <span className="font-mono">{formatTime(moonriseTime)}</span>
            </p>
            <p className="flex justify-between">
              <span>Set:</span>
              <span className="font-mono">{formatTime(moonsetTime)}</span>
            </p>
          </div>
          <div
            className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
              moonIsUp
                ? 'bg-blue-200 text-blue-800'
                : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
            }`}
          >
            {moonIsUp ? '🌕 Currently Up' : '🌑 Currently Down'}
          </div>
        </div>
      </div>

      {/* Current Status Summary */}
      <div className="mt-4 pt-3 border-t border-yellow-300 dark:border-gray-500">
        <div className="flex justify-center items-center gap-4 text-sm">
          <span
            className={`flex items-center gap-1 ${sunIsUp ? 'text-yellow-700' : 'text-gray-500'}`}
          >
            {sunIsUp ? '☀️' : '🌙'} Sun {sunIsUp ? 'Up' : 'Down'}
          </span>
          <span className="text-gray-400">•</span>
          <span
            className={`flex items-center gap-1 ${moonIsUp ? 'text-blue-700' : 'text-gray-500'}`}
          >
            {moonIsUp ? '🌕' : '🌑'} Moon {moonIsUp ? 'Up' : 'Down'}
          </span>
        </div>
      </div>
    </div>
  );
}
