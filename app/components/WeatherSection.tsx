'use client';

import { useState, useEffect } from 'react';
import SunMoonCard from './SunMoonCard';
import LocationSelector from './LocationSelector';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { Location, getActiveLocation } from '@/app/utils/locations';
import { generateUUID } from '@/uuidj';
import toast from 'react-hot-toast';

interface WeatherSectionProps {
  initialForecast: DailyForecastPoint[];
}

export default function WeatherSection({ initialForecast }: WeatherSectionProps) {
  const [forecast, setForecast] = useState<DailyForecastPoint[]>(initialForecast);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  useEffect(() => {
    setCurrentLocation(getActiveLocation());
  }, []);

  const handleLocationChange = async (location: Location) => {
    setCurrentLocation(location);

    try {
      const result = await getDailyForecast(generateUUID());
      setForecast(result.forecast);
    } catch (err) {
      console.error('Failed to fetch forecast for new location:', err);
      toast.error(`Failed to fetch forecast for ${location.displayName}`);
    }
  };

  return (
    <section className="mb-8">
      <LocationSelector onLocationChange={handleLocationChange} />
      <SunMoonCard forecast={forecast} />
    </section>
  );
}