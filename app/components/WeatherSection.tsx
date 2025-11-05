'use client';

import { useState } from 'react';
import SunMoonCard from './SunMoonCard';
import LocationSelector from './LocationSelector';
import { getDailyForecast, DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { Location } from '@/app/utils/locations';
import { generateUUID } from '@/uuidj';
import toast from 'react-hot-toast';

interface WeatherSectionProps {
  initialForecast: DailyForecastPoint[];
}

export default function WeatherSection({ initialForecast }: WeatherSectionProps) {
  const [forecast, setForecast] = useState<DailyForecastPoint[]>(initialForecast);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const handleLocationChange = async (location: Location) => {
    try {
      setSelectedLocation(location);
      const result = await getDailyForecast(generateUUID(), location);
      setForecast(result.forecast);
    } catch (err) {
      console.error('Failed to fetch forecast for new location:', err);
      toast.error(`Failed to fetch forecast for ${location.displayName}`);
    }
  };

  return (
    <section className="mb-8">
      <LocationSelector onLocationChange={handleLocationChange} />
      <SunMoonCard forecast={forecast} location={selectedLocation || undefined} />
    </section>
  );
}
