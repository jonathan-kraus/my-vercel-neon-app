'use server';

import { fetchWeather } from '../lib/fetchWeather';

export async function getWeather() {
  return await fetchWeather();
}

export async function getHourlyForecast() {
  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');

  // Get next 24 hours of hourly forecast
  const url = `https://api.tomorrow.io/v4/timelines?location=40.10520,-75.41404&fields=temperature,precipitationProbability,windSpeed&timesteps=1h&units=imperial&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch hourly forecast');

    const data = await res.json();
    const intervals = data.data.timelines[0].intervals;

    // Return next 24 hours of data
    return intervals.slice(0, 24).map((interval: any) => ({
      time: interval.startTime,
      temperature: interval.values.temperature,
      precipitation: interval.values.precipitationProbability,
      windSpeed: interval.values.windSpeed,
    }));
  } catch (error) {
    console.error('Failed to fetch hourly forecast:', error);
    return [];
  }
}
