'use client';

import { useEffect, useState } from 'react';
import { getDailyForecast, DailyForecastPoint } from '@/app/actions/GetDailyForecast';
const weatherIcons: Record<string, string> = {
  rain: '🌧️',
  snow: '❄️',
  clear: '☀️',
  cloudy: '☁️',
  fog: '🌫️',
  wind: '💨',
  thunderstorm: '⛈️',
  drizzle: '🌦️',
  unknown: '❓',
};
function getIcon(code: string): string {
  if (code.includes('rain')) return weatherIcons.rain;
  if (code.includes('snow')) return weatherIcons.snow;
  if (code.includes('clear')) return weatherIcons.clear;
  if (code.includes('cloud')) return weatherIcons.cloudy;
  if (code.includes('fog')) return weatherIcons.fog;
  if (code.includes('wind')) return weatherIcons.wind;
  if (code.includes('thunder')) return weatherIcons.thunderstorm;
  if (code.includes('drizzle')) return weatherIcons.drizzle;
  return weatherIcons.unknown;
}


export default function DailyForecastCard() {
  const [forecast, setForecast] = useState<DailyForecastPoint[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await getDailyForecast();
      setForecast(data);
    };
    fetch();
  }, []);

  if (!forecast.length) return <p>Loading daily forecast...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">7-Day Forecast</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecast.map((day) => (
          <div key={day.time} className="border p-4 rounded shadow">
            <p><strong>{new Date(day.time).toLocaleDateString()}</strong></p>
            <p className="text-3xl">{getIcon(day.conditions)}</p>
            <p>High: {day.temperatureMax}°F</p>
            <p>Low: {day.temperatureMin}°F</p>
            <p>Precipitation: {day.precipitation}%</p>
            <p>Conditions: {day.conditions}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
