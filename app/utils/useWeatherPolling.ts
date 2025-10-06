import { useEffect, useState, useRef } from 'react';
import { getWeather } from '@/app/actions/getWeather';
import toast from 'react-hot-toast';

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

export const useWeatherPolling = (intervalMs = 10 * 60 * 1000) => {
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWeather = async () => {
    console.log('[Polling] Fetching weather...');
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
      console.error('Failed to fetch weather:', err);
      toast.error('❌ Failed to load weather');
    }
  };

  useEffect(() => {
    fetchWeather(); // initial fetch

    intervalRef.current = setInterval(() => {
      fetchWeather();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs]);

  return weather;
};
