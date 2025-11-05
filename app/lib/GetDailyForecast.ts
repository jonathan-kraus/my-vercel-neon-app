'use server';

import { generateUUID } from '../../uuidj';
import { getActiveLocation, formatLocationForTomorrowIO } from '../utils/locations';

export type DailyForecastPoint = {
  requestId?: string;
  time: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  conditions: {
    day: number;
    night: number;
  };
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
  sunriseTime?: string;
  sunsetTime?: string;
  moonriseTime?: string;
  moonsetTime?: string;
};

export type DailyForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
};
type RawDailyEntry = {
  time: string;
  values: {
    temperatureMax: number;
    temperatureMin: number;
    precipitationProbability: number;
    weatherCodeMax: number;
    weatherCodeMin: number;
    rainAccumulationAvg: number;
    rainAccumulationMax: number;
    rainAccumulationMin: number;
    rainAccumulationSum: number;
    sunriseTime?: string;
    sunsetTime?: string;
    moonriseTime?: string;
    moonsetTime?: string;
  };
};

export async function getDailyForecast(requestId?: string): Promise<DailyForecastResult> {
  console.log(`[getDailyForecast] [${requestId}] Function started`);
  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');
  console.log(`[getDailyForecast] [${requestId}] Using API key: ${apiKey.slice(0, 4)}...`);

  if (!requestId) requestId = generateUUID();
  console.log(`[getDailyForecast] [${requestId}] getDailyForecast started`);

  // Get the active location from feature flags
  const activeLocation = getActiveLocation();
  const locationParam = formatLocationForTomorrowIO(activeLocation);
  console.log(
    `[getDailyForecast] [${requestId}] Using location: ${activeLocation.displayName} (${locationParam})`
  );

  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${locationParam}&timesteps=1d&units=imperial&fields=temperatureMax,temperatureMin,precipitationProbability,weatherCodeMax,weatherCodeMin,rainAccumulationAvg,rainAccumulationMax,rainAccumulationMin,rainAccumulationSum,sunriseTime,sunsetTime,moonriseTime,moonsetTime&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error(`[Tomorrow.io] ❌ HTTP error: ${res.status}`);
    return { forecast: [], maxRainAccumulation: 0 };
  }

  const data = await res.json();

  if (!data || !data.timelines || !Array.isArray(data.timelines.daily)) {
    console.warn(`[Tomorrow.io] ⚠️ Unexpected response format`, data);
    return { forecast: [], maxRainAccumulation: 0 };
  }
  console.log(`[getDailyForecast] [${requestId}] Data fetched from API:`, data);

  console.log(
    `[GetDailyForecast] [${requestId}] Forecast response:`,
    JSON.stringify(data, null, 2)
  );
  const daily: RawDailyEntry[] = data.timelines?.daily;

  console.log(
    `[${requestId}] Raw daily forecastvalues:`,
    daily.map((d) => d.values)
  );
  const maxRainAccumulation = Math.max(
    ...daily.map((d) => d.values.rainAccumulationSum).filter((val) => typeof val === 'number')
  );
  console.log(`[getDailyForecast] [${requestId}] Max rainAccumulationSum:`, maxRainAccumulation);

  console.log(`[getDailyForecast] [${requestId}] JJJ daily entries:`, daily);
  const forecast = daily.slice(0, 7).map(
    (day): DailyForecastPoint => ({
      requestId,
      time: day.time,
      temperatureMax: day.values?.temperatureMax ?? 0,
      temperatureMin: day.values?.temperatureMin ?? 0,
      precipitation: day.values?.precipitationProbability ?? 0,
      conditions: {
        day: day.values.weatherCodeMax ?? -1,
        night: day.values.weatherCodeMin ?? -1,
      },
      rainAccumulationAvg: day.values?.rainAccumulationAvg ?? 0,
      rainAccumulationMax: day.values?.rainAccumulationMax ?? 0,
      rainAccumulationMin: day.values?.rainAccumulationMin ?? 0,
      rainAccumulationSum: day.values?.rainAccumulationSum ?? 0,
      sunriseTime: day.values?.sunriseTime,
      sunsetTime: day.values?.sunsetTime,
      moonriseTime: day.values?.moonriseTime,
      moonsetTime: day.values?.moonsetTime,
    })
  );

  return { forecast, maxRainAccumulation };
}
