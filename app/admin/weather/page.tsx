'use client';

import { useState, useEffect } from 'react';
import WeatherCard from '@/app/components/WeatherCard';
import HourlyForecastChart from '@/app/components/HourlyForecastChart';
import DailyForecastCard from '@/app/components/DailyForecastCard';
import type { DailyForecastPoint } from '@/app/lib/GetDailyForecast';

export default function WeatherPage() {
  const [forecast, setForecast] = useState<DailyForecastPoint[]>([]);
  console.log('[build] Generating /admin/weather');

  useEffect(() => {
    const fetchForecast = async () => {
      const res = await fetch('/api/getDailyForecast');
      const { forecast } = await res.json();
      setForecast(forecast);
    };
    fetchForecast();
  }, []);

  return (
    <main className="p-6 space-y-6">
      <WeatherCard />
      <HourlyForecastChart />
      <DailyForecastCard forecast={forecast} />
    </main>
  );
}
