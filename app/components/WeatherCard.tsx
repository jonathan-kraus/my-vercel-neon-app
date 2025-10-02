'use client';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { getWeather } from '@/app/actions/getWeather';
import { getIcon, getLabel } from '@/app/utils/weatherUtils';
import { getDailyForecast } from '@/app/actions/GetDailyForecast';
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
};
export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherType | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const data = await getWeather();
        setWeather(data);
      } catch (err) {
        console.error('Weather fetch failed:', err);
      }
    };

    fetchWeather();
  }, []);
  useEffect(() => {
  const fetch = async () => {
    const data = await getDailyForecast();
    console.log('Client received forecast:', data); // This will show in browser console
    //setForecast(data);
  };
  fetch();
}, []);

const notify = () => toast(`Temperature: ${weather?.temperature} °F`);
  if (!weather) return <p>Loading weather...</p>;

  return (
    <div className="space-y-2">
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
