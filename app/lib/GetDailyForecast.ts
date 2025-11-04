'use server';
import { generateUUID } from '@/uuidj';

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
  if (!apiKey) {
    console.error('[getDailyForecast] TOMORROW_API_KEY not set');
    return { forecast: [], maxRainAccumulation: 0 };
  }
  console.log(`[getDailyForecast] [${requestId}] Using API key: ${apiKey.slice(0, 4)}...`);

  if (!requestId) requestId = generateUUID();

  try {
    const url = `https://api.tomorrow.io/v4/weather/forecast?location=40.10520,-75.41404&timesteps=1d&units=imperial&apikey=${apiKey}`;

    console.log(
      `[getDailyForecast] [${requestId}] Fetching from URL: ${url.replace(apiKey, '***')}`
    );

    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Tomorrow.io] ❌ HTTP error: ${res.status} ${res.statusText}`);
      return { forecast: [], maxRainAccumulation: 0 };
    }

    const data = await res.json();
    console.log(`[getDailyForecast] [${requestId}] API response received`);

    if (!data || !data.timelines || !Array.isArray(data.timelines.daily)) {
      console.warn(`[Tomorrow.io] ⚠️ Unexpected response format`, data);
      return { forecast: [], maxRainAccumulation: 0 };
    }

    const daily: RawDailyEntry[] = data.timelines.daily;
    console.log(`[getDailyForecast] [${requestId}] Processing ${daily.length} daily entries`);

    const maxRainAccumulation = Math.max(
      ...daily
        .map((d) => d.values?.rainAccumulationSum || 0)
        .filter((val) => typeof val === 'number')
    );

    const forecast = daily.slice(0, 7).map(
      (day): DailyForecastPoint => ({
        requestId,
        time: day.time,
        temperatureMax: day.values?.temperatureMax ?? 0,
        temperatureMin: day.values?.temperatureMin ?? 0,
        precipitation: day.values?.precipitationProbability ?? 0,
        conditions: {
          day: day.values?.weatherCodeMax ?? -1,
          night: day.values?.weatherCodeMin ?? -1,
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

    console.log(
      `[getDailyForecast] [${requestId}] Successfully processed ${forecast.length} forecast entries`
    );
    return { forecast, maxRainAccumulation };
  } catch (error) {
    console.error(`[getDailyForecast] [${requestId}] Error:`, error);
    return { forecast: [], maxRainAccumulation: 0 };
  }
}
