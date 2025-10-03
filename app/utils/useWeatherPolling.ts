import { useEffect, useState } from 'react';

export const useWeatherPolling = (intervalMs = 10 * 60 * 1000) => {
  const [weather, setWeather] = useState(null);

  const fetchWeather = async () => {
    const res = await fetch('/api/weather'); // or your actual route
    const data = await res.json();
    setWeather(data);
  };

  useEffect(() => {
    fetchWeather(); // initial load

    const interval = setInterval(() => {
      fetchWeather();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return weather;
};
