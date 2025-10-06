'use client';
import { useEffect, useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getDailyForecast } from '@/app/actions/GetDailyForecast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';

type WeatherType = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitationProbability: number;
  conditions: { day: number; night: number };
  emailSent?: boolean;
  lastEmailTimestamp: string | null;
  requestId?: string; // 👈 add this
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
};

export default function WeatherCard({ zip }: { zip: string }) {
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // const fetchWeather = async () => {
  //   try {
  //     const res = await fetch(`/api/getWeather?zip=${zip}`);
  //     if (!res.ok) throw new Error('API response not OK');
  //     const data: WeatherType = await res.json();
  //     setWeather(data);
  //     console.log(`Weather received [${data.requestId}]:`, data);

  //     if (data.emailSent) {
  //       toast.success(`[${data.requestId}] 📧 Weather email sent!`);
  //     } else {
  //       toast(`[${data.requestId}] ⏱️ Email already sent today`, { icon: '⏳' } );
  //     }
  //   } catch (err) {
  //     console.error('Failed to fetch current weather:', err);
  //     toast.error('❌ Failed to load weather');
  //   }
  //};

  console.log('WeatherCard rendered');

  useEffect(() => {
    const fetchWeather = async () => {
      const res = await fetch(`/api/getWeather?zip=${zip}`);
      const data: WeatherType = await res.json();
      setWeather(data);
    };

    fetchWeather(); // initial fetch
    intervalRef.current = setInterval(() => {
      fetchWeather();
    }, 30 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    }, [zip]); // ✅ include zip


    useEffect(() => {
      const fetchForecast = async () => {
        const data = await getDailyForecast(zip);
        console.log(`[${new Date().toLocaleTimeString()}] Forecast received:`, data);
      };
      fetchForecast();
    }, [zip]);


  useEffect(() => {
    if (weather?.temperature) {
      toast.success(`Current temperature: ${weather.temperature.toFixed(1)} °F`, {
        icon: '🔥',
        duration: 4000,
      });
    }
  }, [weather]);

  const notify = () => toast(`Temperature: ${weather?.temperature} °F`);

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
