'use client';

import { useState, useEffect } from 'react';
import WeatherCard from '@/app/components/WeatherCard';
import HourlyForecastChart from '@/app/components/HourlyForecastChart';
import DailyForecastCard from '@/app/components/DailyForecastCard';
import type { DailyForecastPoint } from '@/app/lib/GetDailyForecast';

export default function WeatherPage() {
  const [forecast, setForecast] = useState<DailyForecastPoint[]>([]);
  const [maxRainAccumulation, setMaxRainAccumulation] = useState<number>(0);
  console.log('[build] Generating /admin/weather');

  useEffect(() => {
    const fetchForecast = async () => {
      const res = await fetch('/api/getDailyForecast');
      const { forecast, maxRainAccumulation } = await res.json();
      setForecast(forecast);
      setMaxRainAccumulation(maxRainAccumulation ?? 0);
    };
    fetchForecast();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <WeatherCard />
      {maxRainAccumulation > 0 && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
          <p className="font-bold">💧 Rain Alert</p>
          <p>
            Max expected rain accumulation: <strong>{maxRainAccumulation.toFixed(2)} inches</strong>
          </p>
        </div>
      )}
      <HourlyForecastChart />
      <DailyForecastCard forecast={forecast} />
    </main>
  );
}
