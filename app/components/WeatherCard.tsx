'use client';
import { useEffect, useState, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getWeather } from '@/app/actions/getWeather';
import { getDailyForecast } from '@/app/actions/GetDailyForecast';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';

type WeatherType = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitationProbability: number;
  conditions: {
    day: number;
    night: number;
  };
  emailSent?: boolean;
};

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWeather = async () => {
    try {
      const data = await getWeather();
      setWeather(data);

      toast.success(`Current temp: ${data.temperature.toFixed(1)} °F`);

      if (data.emailSent) {
        toast.success('📧 Weather email sent!');
      } else {
        toast('⏱️ Email already sent today');
      }
    } catch (err) {
      console.error('Failed to fetch current weather:', err);
      toast.error('❌ Failed to load weather');
    }
  };

  useEffect(() => {
    fetchWeather(); // initial fetch

    intervalRef.current = setInterval(() => {
      fetchWeather();
    }, 10 * 60 * 1000); // every 10 minutes

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchForecast = async () => {
      const data = await getDailyForecast();
      console.log('Client received forecast:', data);
      console.log('Raw current weather values:', data.values());
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

  if (!weather) return <p>Loading weather...</p>;

  return (
    <div className="space-y-2">
      <Toaster position="top-right" />
      <h2 className="text-xl font-bold">Current Weather</h2>
      <p><strong>Temperature:</strong> {weather.temperature} °F</p>
      <p><strong>Humidity:</strong> {weather.humidity}%</p>
      <p><strong>Wind Speed:</strong> {weather.windSpeed} mph</p>
      <p><strong>Wind Gust:</strong> {weather.windGust} mph</p>
      <p><strong>Precipitation Probability:</strong> {weather.precipitationProbability}%</p>
      <p>Day: {getIcon(weather.conditions.day)} {getLabel(weather.conditions.day)}</p>
      <p>Night: {getIcon(weather.conditions.night)} {getLabel(weather.conditions.night)}</p>
      <button onClick={notify}>Temperature!</button>
    </div>
  );
}
