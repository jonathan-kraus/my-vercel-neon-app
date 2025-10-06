'use client';

import { useEffect, useState } from 'react';
import { getDailyForecast, DailyForecastPoint } from '@/app/actions/GetDailyForecast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';


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




export default function DailyForecastCard() {
  const [forecast, setForecast] = useState<DailyForecastPoint[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await getDailyForecast();
      setForecast(data);
    };
    fetch();
  }, []);
      console.log('Weather codes:', forecast.map(f => f.conditions));
  if (!forecast.length) return <p>Loading daily forecast...</p>;


  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">7-Day Forecast</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecast.map((day) => (
          <div key={day.time} className="border p-4 rounded shadow">
            <p><strong>{new Date(day.time).toLocaleDateString()}</strong></p>
            <p className="text-3xl">{getIcon(day.conditions?.day)}</p>
            <p>High: {day.temperatureMax}°F</p>
            <p>Low: {day.temperatureMin}°F</p>
            <p>Precipitation: {day.precipitation}%</p>
            <p>Day: {getIcon(day.conditions.day)} {getLabel(day.conditions.day)}</p>
            <p>Night: {getIcon(day.conditions.night)} {getLabel(day.conditions.night)}</p>

          </div>
        ))}
      </div>
    </div>
  );
}