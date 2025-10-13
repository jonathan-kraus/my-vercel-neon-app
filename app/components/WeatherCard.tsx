'use client';
import { useEffect, useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';

const requestId = crypto.randomUUID();
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
  locationName?: string; // ✅ Add this
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
};

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/getWeather');
      if (!res.ok) throw new Error('API response not OK');
      const data: WeatherType = await res.json();
      setWeather(data);
      console.log(`Weather received [${data.requestId}]:`, data);
      console.log(`[${data.requestId}] Weather received for ${data.locationName} at ${data.lastEmailTimestamp}:`, data);

      if (data.emailSent) {
        toast.success(`[${data.requestId}] 📧 Weather email sent!`);
      } else {
        toast(`[${data.requestId}] ⏱️ Email already sent today`, { icon: '⏳' } );
      }
    } catch (err) {
      console.error('Failed to fetch current weather:', err);
      toast.error('❌ Failed to load weather');
    }
  };

  console.log(`[WeatherCard] [${requestId}] WeatherCard rendered`);

  useEffect(() => {
    fetchWeather(); // initial fetch
    console.log(`[WeatherCard] [${requestId}]  Interval set for fetching weather every 30 minutes`);
    intervalRef.current = setInterval(() => {
      fetchWeather();
    }, 30 * 60 * 1000); // every 30 minutes

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
  const fetchDailyForecast = async () => {
  try {
    const res = await fetch('/api/getDailyForecast');
    if (!res.ok) throw new Error('Forecast API failed');
    const { forecast, requestId } = await res.json();

    console.log(`[WeatherCard] Forecast received [${requestId}]:`, forecast);
    //setForecast(forecast); // assuming you have a state for this
  } catch (err) {
    console.error(`[WeatherCard] ❌ Forecast fetch error:`, err);
  }
};
  useEffect(() => {
    const fetchForecast = async () => {
      const data = await fetchDailyForecast();
      console.log(`[WeatherCard] Forecast received:`, data);
    };
    fetchForecast();
  }, []);

  useEffect(() => {
    if (weather?.temperature) {
      toast.success(`Current temperature: ${weather.temperature.toFixed(1)} °F`, {
        icon: '🔥',
        duration: 4000,
      });
    }
  }, [weather]);

  const notify = () => toast(`Temperature: ${weather?.temperature} °F`);
  const isWindy = weather?.windSpeed > 10;
  if (!weather) return <p>Loading weather...</p>;

  const nextEmailInHours =
    weather.lastEmailTimestamp
      ? 4 - ((Date.now() - new Date(weather.lastEmailTimestamp).getTime()) / 3600000)
      : null;

  return (
    <div className="space-y-2">
      <Toaster position="top-right" />
      <h2 className="text-xl font-bold">Current Weather</h2>
      {weather.rainAccumulationSum > 0 && (
  <div className="space-y-1">
    <p><strong>Rain Avg:</strong> {weather.rainAccumulationAvg.toFixed(2)} in</p>
    <p><strong>Rain Max:</strong> {weather.rainAccumulationMax.toFixed(2)} in</p>
    <p><strong>Rain Min:</strong> {weather.rainAccumulationMin.toFixed(2)} in</p>
    <p><strong>Rain Total:</strong> {weather.rainAccumulationSum.toFixed(2)} in</p>
  </div>
)}
      <p><strong>Temperature:</strong> {weather.temperature} °F</p>
      <p><strong>Humidity:</strong> {weather.humidity}%</p>
      <p className={`text-sm text-gray-600 flex items-center gap-2 ${isWindy ? 'animate-wiggle' : ''}`}>
      Wind Speed: {weather.windSpeed ?? 'N/A'} mph 💨
      </p>

      <p><strong>Wind Speed:</strong> {weather.windSpeed} mph</p>
      <p><strong>Wind Gust:</strong> {weather.windGust} mph</p>
      <p><strong>Precipitation Probability:</strong> {weather.precipitationProbability}%</p>
      <p>Day: {getIcon(weather.conditions.day)} {getLabel(weather.conditions.day)}</p>
      <p>Night: {getIcon(weather.conditions.night)} {getLabel(weather.conditions.night)}</p>

      <button onClick={notify}>Temperature!</button>

      {weather.lastEmailTimestamp && (
        <p className="text-sm text-gray-500">
          📧 Last email sent: {new Date(weather.lastEmailTimestamp).toLocaleString()}
        </p>
      )}

      {nextEmailInHours !== null && nextEmailInHours > 0 && (
        <p className="text-xs text-gray-500">
          Next email in: {nextEmailInHours.toFixed(1)} hours
        </p>
      )}

      {weather.emailSent ? (
        <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
          Email sent ✅
        </span>
      ) : (
        <span className="inline-block px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
          Email pending ⏳
        </span>
      )}
    </div>
  );
}