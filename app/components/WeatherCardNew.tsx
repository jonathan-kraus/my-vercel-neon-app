'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';
type LocationDetails = { city?: string; town?: string; village?: string; hamlet?: string; county?: string; displayName?: string; };
type WeatherType = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitationProbability: number;
  conditions: { day: number; night: number };
  emailSent?: boolean;
  lastEmailTimestamp: string | null;
  requestId?: string;
  locationName?: string;
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
  locationDetails?: LocationDetails;
};

export default function WeatherCardNew({ location }: { location?: { name: string; lat: number; lon: number; displayName: string; flag: string } } = {}) {
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchWeather = useCallback(async () => {
    try {
      const url = location ? `/api/getWeather?location=${location.name}` : '/api/getWeather';
      const res = await fetch(url);
      if (!res.ok) throw new Error('API response not OK');
      const data: WeatherType = await res.json();
      setWeather(data);
      console.log(`Weather received [${data.requestId}]:`, data);
      console.log(
        `[${data.requestId}] Weather received for ${data.locationName} at ${data.lastEmailTimestamp}:`,
        data
      );

      if (data.emailSent) {
        toast.success(`[${data.requestId}] 📧 Weather email success!`);
      } else {
        toast(`[${data.requestId}] ⏱️ Email already sent today`, { icon: '⏳' });
      }
    } catch (err) {
      console.error('Failed to fetch current weather:', err);
      toast.error('❌ Failed to load weather');
    }
  }, [location]);

  useEffect(() => {
    fetchWeather();
    intervalRef.current = setInterval(
      () => {
        fetchWeather();
      },
      30 * 60 * 1000
    );

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchWeather]);

  if (!weather) {
    return (
      <div className="bg-linear-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl p-8 animate-pulse">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const weatherIcon = getIcon(weather.conditions.day);
  const weatherLabel = getLabel(weather.conditions.day);
  const locationDisplay = weather.locationDetails?.displayName || weather.locationName || 'Unknown Location';
  const isWindy = typeof weather?.windSpeed === 'number' && weather.windSpeed > 10;

  return (
    <div className="bg-linear-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 text-white transform transition-all hover:scale-105 hover:shadow-3xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-1">Current Weather</h2>
            <p className="text-blue-100 text-sm">{locationDisplay}</p>
          </div>
          <div className="text-7xl" role="img" aria-label={weatherLabel}>
            {weatherIcon}
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-baseline space-x-2">
          <span className="text-7xl font-bold">{Math.round(weather.temperature)}</span>
          <span className="text-4xl font-light">°F</span>
        </div>

        {/* Conditions */}
        <div className="text-xl font-medium text-blue-50">
          {weatherLabel}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span className="text-sm font-medium text-blue-100">Humidity</span>
            </div>
            <p className="text-2xl font-bold">{weather.humidity}%</p>
          </div>

          <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 ${isWindy ? 'animate-bounce' : ''}`}>
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
              </svg>
              <span className="text-sm font-medium text-blue-100">Wind</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(weather.windSpeed)} mph</p>
            <p className="text-xs text-blue-100 mt-1">Gusts: {Math.round(weather.windGust)} mph</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span className="text-sm font-medium text-blue-100">Precipitation</span>
            </div>
            <p className="text-2xl font-bold">{weather.precipitationProbability}%</p>
          </div>

          {weather.rainAccumulationSum > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm font-medium text-blue-100">Rain Total</span>
              </div>
              <p className="text-2xl font-bold">{weather.rainAccumulationSum.toFixed(2)}&quot;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
