'use server';

import { fetchWeather } from '../lib/fetchWeather';

export async function getWeather() {
  return await fetchWeather();
}

export async function getHourlyForecast() {
  // This might need to be implemented based on what HourlyForecastChart expects
  // For now, return empty array
  return [];
}
