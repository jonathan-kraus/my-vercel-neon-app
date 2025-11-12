//app/admin/weather/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import DailyForecastCard from '@/app/components/DailyForecastCard';
import DailyForecastCardNew from '@/app/components/DailyForecastCardNew';
import WeatherCard from '@/app/components/WeatherCard';
import WeatherCardNew from '@/app/components/WeatherCardNew';
import HourlyForecastChart from '@/app/components/HourlyForecastChart';
import SunMoonCard from '@/app/components/SunMoonCard';
import LocationSelector from '@/app/components/LocationSelector';
import LocationMap from '@/app/components/LocationMap';
import SendForecastEmailButton from '@/app/components/SendForecastEmailButton';
import { Location, getActiveLocation } from '@/app/utils/locations';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import { isFeatureEnabled } from '@/app/utils/featureFlags';

type ForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};

export default function WeatherPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [requestId] = useState(() => generateUUID());
  const log = createLogger('JKapp/admin/weather/page.tsx', requestId);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(getActiveLocation());
  const useNewUI = isFeatureEnabled('NEW_UI_COMPONENTS');

  const onLog = useCallback(
    async (severity: 'info' | 'error', message: string, metadata?: Record<string, any>) => {
      if (severity === 'info') {
        await log.info(message, metadata || {});
      } else {
        await log.error(message, metadata || {});
      }
    },
    [requestId, log]
  );

  const handleLocationChange = async (location: Location) => {
    setSelectedLocation(location); // Update selected location
    setForecast(null); // Clear current forecast while loading
    // emailSentRef.current = false; // Reset email sent flag for new location - removed to prevent multiple sends

    try {
      const result = await getDailyForecast(generateUUID(), location); // Pass the selected location
      setForecast(result);
      if (!requestId) {
        let requestId = 'not passed';
      }
      log.info('Fetched forecast for new location', {
        location: location.displayName,
        forecastLength: result.forecast.length,
      });
    } catch (err) {
      console.error('Failed to fetch forecast for new location:', err);
      toast.error(`Failed to fetch forecast for ${location.displayName}`);
      await log.error('Forecast fetch failed for new location', {
        error: String(err),
        location: location.displayName,
      });
    }
  };

  // Fetch forecast on mount
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const result = await getDailyForecast(requestId);
        setForecast(result);
        log.info('Fetched forecast', { forecastLength: result.forecast.length });
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
        toast.error('Failed to fetch forecast');
        await log.error('Forecast fetch failed');
      }
    };
    fetchForecast();
  }, [requestId]);

  // Auto-send removed - use manual SendForecastEmailButton instead to avoid rate limiting

  if (!forecast || forecast.forecast.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 font-medium">Loading forecast...</p>
        </div>
      </div>
    );
  }

  const WeatherComponent = useNewUI ? WeatherCardNew : WeatherCard;
  const ForecastComponent = useNewUI ? DailyForecastCardNew : DailyForecastCard;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Weather Forecast
        </h1>
        <p className="text-gray-600 text-sm md:text-base">
          Real-time weather updates and forecasts
        </p>
      </div>

      {/* Location Selector */}
      <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
        <LocationSelector onLocationChange={handleLocationChange} />
      </div>

      {/* Email Button */}
      {forecast && forecast.forecast.length > 0 && (
        <div className="flex justify-center">
          <SendForecastEmailButton
            forecast={forecast.forecast}
            requestId={requestId}
            onLog={onLog}
          />
        </div>
      )}

      {/* Rain Alert */}
      {forecast.maxRainAccumulation > 0 && (
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 p-5 rounded-xl shadow-md">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-bold mb-1">Rain Alert</h3>
              <p className="text-sm">
                Maximum rain accumulation of{' '}
                <span className="font-semibold">
                  {forecast.maxRainAccumulation.toFixed(2)} inches
                </span>{' '}
                expected in the forecast period.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Weather Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sun & Moon Card */}
        <div>
          <SunMoonCard forecast={forecast.forecast} location={selectedLocation || undefined} />
        </div>

        {/* Current Weather Card */}
        <div>
          <WeatherComponent location={selectedLocation || undefined} />
        </div>
      </div>

      {/* Hourly Forecast Chart */}
      <div>
        <HourlyForecastChart />
      </div>

      {/* Daily Forecast */}
      <div>
        <ForecastComponent forecast={forecast.forecast} />
      </div>

      {/* Location Map */}
      {selectedLocation && (
        <div>
          <LocationMap location={selectedLocation} />
        </div>
      )}
    </div>
  );
}
