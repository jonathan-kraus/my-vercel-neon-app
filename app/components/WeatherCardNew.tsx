'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';
import { useCallback } from 'react';
type LocationDetails = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  displayName?: string;
};
type WeatherType = {
  temperature: number;
  feelsLike?: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitationProbability: number;
  pressure?: number | null;
  visibility?: number | null;
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

export default function WeatherCardNew({
  location,
}: {
  location?: { name: string; lat: number; lon: number; displayName: string; flag: string };
} = {}) {
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Small numeric animator used across Cloudspace and Weather cards
  function NumberCounter({ value }: { value: number }) {
    const ref = useRef<number | null>(null);
    const [display, setDisplay] = useState(0);

    useEffect(() => {
      const duration = 500;
      const start = performance.now();
      const from = display;
      const to = value;

      const step = (ts: number) => {
        const t = Math.min(1, (ts - start) / duration);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const cur = Math.round(from + (to - from) * eased);
        setDisplay(cur);
        if (t < 1) ref.current = requestAnimationFrame(step);
      };

      ref.current = requestAnimationFrame(step);
      return () => {
        if (ref.current) cancelAnimationFrame(ref.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return <span className="text-2xl md:text-3xl font-bold">{display}</span>;
  }

  function Sparkline({
    value,
    max = 100,
    color = 'blue',
  }: {
    value: number;
    max?: number;
    color?: string;
  }) {
    const pts = new Array(8).fill(0).map((_, i) => {
      const norm = Math.max(
        0,
        Math.min(1, (value / Math.max(1, max)) * (0.5 + 0.5 * Math.sin(i + value)))
      );
      const x = (i / 7) * 100;
      const y = 100 - norm * 100;
      return `${x},${y}`;
    });
    const d = 'M ' + pts.join(' L ');
    const stroke = color === 'blue' ? '#ffffff' : color === 'purple' ? '#e9d5ff' : '#a7f3d0';
    return (
      <svg width="64" height="20" viewBox="0 0 100 100" preserveAspectRatio="none" className="ml-3">
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeOpacity={0.9}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  const fetchWeather = useCallback(async () => {
    try {
      const url = location ? `/api/getWeather?location=${location.name}` : '/api/getWeather';
      const res = await fetch(url);
      if (!res.ok) throw new Error('API response not OK');
      const data: WeatherType = await res.json();
      setWeather(data);
      setLastUpdated(Date.now());
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
  const locationDisplay =
    weather.locationDetails?.displayName || weather.locationName || 'Unknown Location';
  const isWindy = typeof weather?.windSpeed === 'number' && weather.windSpeed > 10;

  // Dynamic gradient based on temperature
  const getTemperatureGradient = (temp: number) => {
    if (temp >= 80) return 'from-orange-500 via-red-500 to-pink-600';
    if (temp >= 60) return 'from-yellow-400 via-orange-500 to-red-500';
    if (temp >= 40) return 'from-blue-400 via-indigo-500 to-purple-600';
    return 'from-blue-600 via-cyan-500 to-teal-600';
  };

  const gradientClass = getTemperatureGradient(weather.temperature);

  return (
    <div
      className={`bg-linear-to-br ${gradientClass} rounded-3xl shadow-2xl p-6 md:p-8 text-white transform transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl relative overflow-hidden`}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative flex flex-col space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-bold mb-1 drop-shadow-lg">Current Weather</h2>
            <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {locationDisplay}
            </p>
          </div>
          <div
            className="text-6xl md:text-7xl transform transition-transform duration-300 hover:scale-110 drop-shadow-2xl"
            role="img"
            aria-label={weatherLabel}
          >
            {weatherIcon}
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-baseline space-x-2">
          <NumberCounter value={Math.round(weather.temperature)} />
          <span className="text-3xl md:text-4xl font-light opacity-90">°F</span>
          <Sparkline value={Math.round(weather.temperature)} max={120} color="purple" />
        </div>

        {/* Feels Like */}
        {weather.feelsLike && Math.abs(weather.feelsLike - weather.temperature) > 1 && (
          <div className="text-base md:text-lg text-white/80 font-medium">
            Feels like {Math.round(weather.feelsLike)}°F
          </div>
        )}

        {/* Conditions */}
        <div className="text-lg md:text-xl font-semibold text-white/95 drop-shadow-md">
          {weatherLabel}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 border-t border-white/30">
          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
              <span className="text-xs md:text-sm font-medium text-white/90">Humidity</span>
            </div>
            <div className="flex items-center gap-3">
              <NumberCounter value={Math.round(weather.humidity)} />
              <span className="text-sm text-white/80">%</span>
              <Sparkline value={Math.round(weather.humidity)} max={100} color="blue" />
            </div>
          </div>

          <div
            className={`bg-white/20 backdrop-blur-md rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/20 ${isWindy ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.5 2c1.242 0 2.25 1.008 2.25 2.25S15.742 6.5 14.5 6.5H2M17.5 12c1.242 0 2.25 1.008 2.25 2.25S18.742 16.5 17.5 16.5H2M12.5 22c1.242 0 2.25-1.008 2.25-2.25S13.742 17.5 12.5 17.5H2"
                />
              </svg>
              <span className="text-xs md:text-sm font-medium text-white/90">Wind</span>
            </div>
            <div className="flex items-center gap-3">
              <NumberCounter value={Math.round(weather.windSpeed)} />
              <span className="text-sm text-white/80">mph</span>
              <Sparkline value={Math.round(weather.windSpeed)} max={60} color="green" />
            </div>
            <p className="text-xs text-white/80 mt-1">Gusts: {Math.round(weather.windGust)} mph</p>
          </div>

          <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
              <span className="text-xs md:text-sm font-medium text-white/90">Precipitation</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{weather.precipitationProbability}%</p>
          </div>

          {weather.pressure ? (
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/20">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-xs md:text-sm font-medium text-white/90">Pressure</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{weather.pressure.toFixed(2)}</p>
              <p className="text-xs text-white/80 mt-1">inHg</p>
            </div>
          ) : weather.rainAccumulationSum > 0 ? (
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/20">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
                <span className="text-xs md:text-sm font-medium text-white/90">Rain Total</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">
                {weather.rainAccumulationSum.toFixed(2)}&quot;
              </p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-white/10 opacity-50">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-xs md:text-sm font-medium text-white/70">UV Index</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white/70">--</p>
            </div>
          )}
        </div>

        {/* Additional Stats Row */}
        {weather.visibility && (
          <div className="grid grid-cols-1 gap-3 md:gap-4 pt-4 border-t border-white/30">
            {/* aria-live status for assistive tech */}
            {lastUpdated && (
              <div className="sr-only" aria-live="polite">
                Updated at {new Date(lastUpdated).toLocaleTimeString()}
              </div>
            )}
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-white/30 hover:scale-105 border border-white/20">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span className="text-xs md:text-sm font-medium text-white/90">Visibility</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold">{weather.visibility.toFixed(1)} mi</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
