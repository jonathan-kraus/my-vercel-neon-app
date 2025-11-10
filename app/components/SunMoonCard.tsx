'use client';

import { DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { isFeatureEnabled } from '@/app/utils/featureFlags';
import { getActiveLocation, Location } from '@/app/utils/locations';

interface SunMoonCardProps {
  forecast: DailyForecastPoint[];
  location?: Location;
}

export default function SunMoonCard({ forecast, location }: SunMoonCardProps) {
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
    // Use local time zone for display
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg p-6 border border-amber-200/50 dark:border-gray-600 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-2xl">🌅</span>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Sun & Moon Today</h3>
          <span className="text-2xl">🌙</span>
        </div>

        {isFeatureEnabled('WEATHER_LOCATION_DISPLAY') && (
          <div className="mb-5 p-3 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl text-sm text-center text-blue-800 dark:text-blue-200 border border-blue-200/50 dark:border-blue-700/50">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location?.displayName || getActiveLocation().displayName}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sun Section */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-yellow-200/50 dark:border-gray-600 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="text-center">
              <div className={`text-5xl mb-3 transform transition-transform duration-300 ${sunIsUp ? 'animate-pulse scale-110' : 'opacity-50 scale-100'}`}>
                {sunIsUp ? '☀️' : '🌙'}
              </div>
              <h4 className="font-bold text-lg text-yellow-800 dark:text-yellow-200 mb-4">Sun</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Rise
                  </span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{formatTime(sunriseTime)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Set
                  </span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{formatTime(sunsetTime)}</span>
                </div>
              </div>
              <div
                className={`mt-4 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  sunIsUp
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {sunIsUp ? '☀️ Currently Up' : '🌙 Currently Down'}
              </div>
            </div>
          </div>

          {/* Moon Section */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-5 border border-blue-200/50 dark:border-gray-600 transition-all duration-300 hover:shadow-lg hover:scale-105">
            <div className="text-center">
              <div className={`text-5xl mb-3 transform transition-transform duration-300 ${moonIsUp ? 'animate-pulse scale-110' : 'opacity-50 scale-100'}`}>
                {moonIsUp ? '🌕' : '🌑'}
              </div>
              <h4 className="font-bold text-lg text-blue-800 dark:text-blue-200 mb-4">Moon</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Rise
                  </span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{formatTime(moonriseTime)}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Set
                  </span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{formatTime(moonsetTime)}</span>
                </div>
              </div>
              <div
                className={`mt-4 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                  moonIsUp
                    ? 'bg-gradient-to-r from-blue-400 to-indigo-400 text-blue-900 shadow-lg'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {moonIsUp ? '🌕 Currently Up' : '🌑 Currently Down'}
              </div>
            </div>
          </div>
        </div>

        {/* Current Status Summary */}
        <div className="mt-6 pt-4 border-t border-amber-300/50 dark:border-gray-500">
          <div className="flex justify-center items-center gap-4 text-sm font-medium">
            <span
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                sunIsUp 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {sunIsUp ? '☀️' : '🌙'} Sun {sunIsUp ? 'Up' : 'Down'}
            </span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                moonIsUp 
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {moonIsUp ? '🌕' : '🌑'} Moon {moonIsUp ? 'Up' : 'Down'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
