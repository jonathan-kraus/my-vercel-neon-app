'use client';

import type { DailyForecastPoint } from '@/app/lib/GetDailyForecast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';

type DailyForecastCardProps = {
  forecast: DailyForecastPoint[];
};

export default function DailyForecastCardNew({ forecast }: DailyForecastCardProps) {
  if (!forecast || forecast.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 bg-linear-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-gray-600 font-medium">Loading forecast...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          7-Day Forecast
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Updated now</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {forecast.map((day, index) => {
          const date = new Date(day.time);
          const isToday = index === 0;
          const dayName = isToday
            ? 'Today'
            : date.toLocaleDateString('en-US', { weekday: 'short' });
          const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          const tempColor =
            day.temperatureMax > 80
              ? 'from-red-400 to-orange-500'
              : day.temperatureMax > 60
                ? 'from-yellow-400 to-orange-400'
                : 'from-blue-400 to-cyan-500';

          return (
            <div
              key={day.time}
              className={`group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                isToday ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${tempColor} opacity-10 group-hover:opacity-20 transition-opacity`}
              ></div>

              <div className="relative p-5 bg-white/90 backdrop-blur-sm">
                {/* Date header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p
                      className={`font-bold ${isToday ? 'text-blue-600 text-lg' : 'text-gray-800 text-base'}`}
                    >
                      {dayName}
                    </p>
                    <p className="text-xs text-gray-500">{monthDay}</p>
                  </div>
                  {isToday && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                      Today
                    </span>
                  )}
                </div>

                {/* Weather icon */}
                <div className="flex justify-center my-4">
                  <span
                    className="text-6xl drop-shadow-lg"
                    role="img"
                    aria-label={getLabel(day.conditions?.day)}
                  >
                    {getIcon(day.conditions?.day)}
                  </span>
                </div>

                {/* Temperature */}
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">
                      {Math.round(day.temperatureMax)}°
                    </p>
                    <p className="text-xs text-gray-500 font-medium">High</p>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-600">
                      {Math.round(day.temperatureMin)}°
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Low</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                        />
                      </svg>
                      <span>Precipitation</span>
                    </div>
                    <span className="font-semibold text-gray-800">{day.precipitation}%</span>
                  </div>

                  {/* Day/Night conditions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-yellow-800 font-medium mb-1">Day</p>
                      <p className="text-2xl">{getIcon(day.conditions.day)}</p>
                      <p className="text-xs text-yellow-700 mt-1">{getLabel(day.conditions.day)}</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-indigo-800 font-medium mb-1">Night</p>
                      <p className="text-2xl">{getIcon(day.conditions.night)}</p>
                      <p className="text-xs text-indigo-700 mt-1">
                        {getLabel(day.conditions.night)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
