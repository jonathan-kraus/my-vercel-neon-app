import { useEffect, useState, useMemo } from 'react';
import { getWeather } from '@/app/actions/getWeather';


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


export function useWeatherPolling(zip: string) {
  const [weather, setWeather] = useState<WeatherType | null>(null);

  const requestId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const fetchWeather = async () => {
      console.log(`[${requestId}] Polling weather for ZIP: ${zip}`);
      const data = await getWeather(zip);
      setWeather(data);
    };

    fetchWeather();

    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [zip, requestId]);

  return weather;
}
