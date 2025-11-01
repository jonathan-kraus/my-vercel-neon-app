'use client';

import type { DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';

type DailyForecastCardProps = {
  forecast: DailyForecastPoint[];
};

export default function DailyForecastCard({ forecast }: DailyForecastCardProps) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading daily forecast...</span>
      </div>
    );
  }

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
