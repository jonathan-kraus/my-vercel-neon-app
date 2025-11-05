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
import { logInfoFactory, logErrorFactory } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import { isFeatureEnabled } from '@/app/utils/featureFlags';

const logInfo = logInfoFactory('app/admin/weather/page.tsx');
const logError = logErrorFactory('app/admin/weather/page.tsx');
type ForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};

export default function WeatherPage() {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [requestId] = useState(() => generateUUID());
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(getActiveLocation());
  const useNewUI = isFeatureEnabled('NEW_UI_COMPONENTS');
  
  const onLog = useCallback(
    async (severity: 'info' | 'error', message: string, metadata?: Record<string, any>) => {
      if (severity === 'info') {
        await logInfo(message, metadata || {}, requestId);
      } else {
        await logError(message, metadata || {});
      }
    },
    [requestId]
  );

  const handleLocationChange = async (location: Location) => {
    setSelectedLocation(location); // Update selected location
    setForecast(null); // Clear current forecast while loading
    // emailSentRef.current = false; // Reset email sent flag for new location - removed to prevent multiple sends

    try {
      const result = await getDailyForecast(generateUUID(), location); // Pass the selected location
      setForecast(result);
      logInfo(
        'Fetched forecast for new location',
        {
          location: location.displayName,
          forecastLength: result.forecast.length,
        },
        requestId
      );
    } catch (err) {
      console.error('Failed to fetch forecast for new location:', err);
      toast.error(`Failed to fetch forecast for ${location.displayName}`);
      await logError('Forecast fetch failed for new location', {
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
        logInfo('Fetched forecast', { forecastLength: result.forecast.length }, requestId);
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
        toast.error('Failed to fetch forecast');
        await logError('Forecast fetch failed');
      }
    };
    fetchForecast();
  }, [requestId]);

  // Auto-send removed - use manual SendForecastEmailButton instead to avoid rate limiting

  if (!forecast || forecast.forecast.length === 0) return <p>Loading forecast...</p>;

  const WeatherComponent = useNewUI ? WeatherCardNew : WeatherCard;
  const ForecastComponent = useNewUI ? DailyForecastCardNew : DailyForecastCard;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl text-center font-bold">Weather</h2>

      <LocationSelector onLocationChange={handleLocationChange} />

      {selectedLocation && <LocationMap location={selectedLocation} />}

      {forecast && forecast.forecast.length > 0 && (
        <SendForecastEmailButton forecast={forecast.forecast} requestId={requestId} onLog={onLog} />
      )}

      {forecast.maxRainAccumulation > 0 && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                <strong>Rain Alert:</strong> Maximum rain accumulation of{' '}
                {forecast.maxRainAccumulation.toFixed(2)} inches expected in the forecast period.
              </p>
            </div>
          </div>
        </div>
      )}

      <WeatherComponent location={selectedLocation || undefined} />

      <SunMoonCard forecast={forecast.forecast} location={selectedLocation || undefined} />

      <HourlyForecastChart />

      <ForecastComponent forecast={forecast.forecast} />
    </div>
  );
}
