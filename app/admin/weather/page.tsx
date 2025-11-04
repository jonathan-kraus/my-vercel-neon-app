//app/admin/weather/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { sendForecastEmail } from '@/app/lib/sendForecastEmail';
import DailyForecastCard from '@/app/components/DailyForecastCard';
import WeatherCard from '@/app/components/WeatherCard';
import HourlyForecastChart from '@/app/components/HourlyForecastChart';
import { logInfoFactory, logErrorFactory } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';

const logInfo = logInfoFactory('app/admin/weather/page.tsx');
const logError = logErrorFactory('app/admin/weather/page.tsx');
type ForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};

export default function WeatherPage(req: Request) {
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const requestId = req.headers.get('x-request-id') ?? 'weatheruid';
  const emailSentRef = useRef(false);

  // Fetch forecast on mount
  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const result = await getDailyForecast(requestId);
        setForecast(result);
        logInfo('Fetched forecast', { forecastLength: result.forecast.length });
      } catch (err) {
        console.error('Failed to fetch forecast:', err);
        toast.error('Failed to fetch forecast');
        await logError('Forecast fetch failed');
      }
    };
    fetchForecast();
  }, [requestId]);

  // Auto-send once after forecast loads
  useEffect(() => {
    if (forecast && forecast.forecast.length > 0 && !emailSentRef.current) {
      emailSentRef.current = true;
      // Auto-send email
      sendForecastEmail(forecast.forecast, requestId)
        .then(() => {
          logInfo('Success: Forecast auto send email', {
            forecastLength: forecast.forecast.length,
          });
        })
        .catch((err) => {
          console.error('Failed to send forecast email:', err);
          logError('Forecast email failed', { error: String(err) });
        });
    }
  }, [forecast, requestId]);

  if (!forecast || forecast.forecast.length === 0) return <p>Loading forecast...</p>;

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-xl text-center font-bold">Weather</h2>

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

      <WeatherCard />

      <HourlyForecastChart />

      <DailyForecastCard forecast={forecast.forecast} />
    </div>
  );
}
