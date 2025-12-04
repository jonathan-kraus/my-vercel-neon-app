//app/admin/weather/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import DailyForecastCardNew from '@/app/components/DailyForecastCardNew';
import WeatherCardNew from '@/app/components/WeatherCardNew';
import HourlyForecastChart from '@/app/components/HourlyForecastChart';
import SunMoonCard from '@/app/components/SunMoonCard';
import LocationSelector from '@/app/components/LocationSelector';
import LocationMap from '@/app/components/LocationMap';
import SendForecastEmailButton from '@/app/components/SendForecastEmailButton';
import { Location, getActiveLocation } from '@/app/utils/locations';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';

// unused: feature flags are no longer checked here

type ForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};

export default function WeatherPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [precip, setPrecip] = useState<number | null>(null);
  const [requestId] = useState(() => generateUUID());
  const log = createLogger('JKapp/admin/weather/page.tsx', requestId);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Fetch active location
  useEffect(() => {
    (async () => {
      const location = await getActiveLocation();
      setSelectedLocation(location);
    })();
  }, []);

  // Fetch precipitation value from API
  useEffect(() => {
    fetch('/api/getPrecip')
      .then((res) => res.json())
      .then((data) => {
        console.log('Rain accumulation from API:', data.precip?.rainAccumulationSum);
        setPrecip(data.precip?.rainAccumulationSum ?? 0);
      });
  }, []);

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
      const result = await getDailyForecast(requestId, location); // Pass the selected location
      setForecast(result);

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

  const WeatherComponent = WeatherCardNew;
  const ForecastComponent = DailyForecastCardNew;

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
