'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo } from 'react';
import type { DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';
import { logger } from '../lib/logger';

const requestId = crypto.randomUUID();
console.log(`[DailyForecastCard] [${requestId}] DailyForecastCard loaded`);

// const weatherIcons: Record<string, string> = {
//   rain: '🌧️',
//   snow: '❄️',
//   clear: '☀️',
//   cloudy: '☁️',
//   fog: '🌫️',
//   wind: '💨',
//   thunderstorm: '⛈️',
//   drizzle: '🌦️',
//   unknown: '❓',
// };

const fetchDailyForecast = async () => {
  try {
    const res = await fetch('/api/getDailyForecast');
    if (!res.ok) throw new Error('Forecast API failed');
    const { forecast, requestId } = await res.json();

    console.log(`[DailyForecastCard] Forecast received [${requestId}]:`, forecast);
    //setForecast(forecast); // assuming you have a state for this
  } catch (err) {
    console.error(`[DailyForecastCard] ❌ Forecast fetch error:`, err);
  }
};

export default function DailyForecastCard({ forecast }: { forecast: DailyForecastPoint[] }) {
  //const [forecast] = useState<DailyForecastPoint[]>([]);
  const requestId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const fetch = async () => {
      try {
        console.log(`[DailyForecastCard] [${requestId}] Fetching forecast for ZIP code 02245...`);
        const data = await fetchDailyForecast();
        console.log(`[DailyForecastCard] [${requestId}] Forecast data:`, data);
        //setForecast(data);
      } catch (err) {
        console.error(`[DailyForecastCard] [${requestId}] Forecast fetch failed:`, err);
      }
    };
    fetch();
  }, [requestId]);
  console.log(
    `[DailyForecastCard] [${requestId}] Weather codes:`,
    forecast.map((f) => f.conditions)
  );
  useEffect(() => {
    const logEvent = async () => {
      const baseUrl =
        (typeof window !== 'undefined' && window.location.origin) ||
        (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
        process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
        'https://www.kraus.my.id';
      try {
        await logger({
          severity: 'info',
          source: 'DailyForecastCard.tsx',
          message: `Fetching daily forecast baseurl: ${baseUrl} `,
          requestId,
          metadata: { userAction: 'fetch', Component: 'DailyForecastCard' },
        });
      } catch (error) {
        console.error(`[${requestId}] Failed to log event:`, error);
      }
    };

    logEvent();
  }, [requestId, forecast]);
  if (!forecast.length) return <p>Loading daily forecast...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">7-Day Forecast</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecast.map((day) => (
          <div key={day.time} className="border p-4 rounded shadow">
            <p>
              <strong>{new Date(day.time).toLocaleDateString()}</strong>
            </p>
            <p className="text-3xl">{getIcon(day.conditions?.day)}</p>
            <p>High: {day.temperatureMax}°F</p>
            <p>Low: {day.temperatureMin}°F</p>
            <p>Precipitation: {day.precipitation}%</p>
            <p>
              Day: {getIcon(day.conditions.day)} {getLabel(day.conditions.day)}
            </p>
            <p>
              Night: {getIcon(day.conditions.night)} {getLabel(day.conditions.night)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
