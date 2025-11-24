'use server';

import { z } from 'zod';
import { generateUUID } from '@/uuidj';
import { getActiveLocation, formatLocationForTomorrowIO, Location } from '../utils/locations';
import { isFeatureEnabled } from '../utils/featureFlags';
import { createLogger } from '../utils/logger';
import { db } from './db';
import type { WeatherCache } from '@prisma/client';

// Zod schemas
const ConditionsSchema = z.object({
  day: z.number(),
  night: z.number(),
});

const DailyForecastPointSchema = z.object({
  requestId: z.string().optional(),
  time: z.string(),
  temperatureMax: z.number(),
  temperatureMin: z.number(),
  precipitation: z.number(),
  conditions: ConditionsSchema,
  rainAccumulationAvg: z.number(),
  rainAccumulationMax: z.number(),
  rainAccumulationMin: z.number(),
  rainAccumulationSum: z.number(),
  sunriseTime: z.string().optional().nullable(),
  sunsetTime: z.string().optional().nullable(),
  moonriseTime: z.string().optional().nullable(),
  moonsetTime: z.string().optional().nullable(),
});

const DailyForecastResultSchema = z.object({
  forecast: z.array(DailyForecastPointSchema),
  maxRainAccumulation: z.number(),
  error: z
    .object({
      type: z.union([
        z.literal('rate_limit'),
        z.literal('network'),
        z.literal('api_error'),
        z.literal('unknown'),
      ]),
      message: z.string(),
      statusCode: z.number().optional(),
    })
    .optional(),
});

export type DailyForecastPoint = z.infer<typeof DailyForecastPointSchema>;
export type DailyForecastResult = z.infer<typeof DailyForecastResultSchema>;

// Returns DailyForecastResult using only cached weather data (no API calls)
export async function getCachedDailyForecast(
  requestId?: string,
  location?: Location
): Promise<DailyForecastResult> {
  if (!requestId) requestId = generateUUID();
  const log = createLogger('getCachedDailyForecast', requestId);
  const locationToUse = location || (await getActiveLocation());

  // Try to get up to 7 days of cached weather for the location
  const cached = await db.weatherCache.findMany({
    where: { location: locationToUse.name },
    orderBy: { updatedAt: 'desc' },
    take: 7,
  });

  if (!cached || cached.length === 0) {
    await log.warn('No cached weather data found', { location: locationToUse.name });
    const result = {
      forecast: [],
      maxRainAccumulation: 0,
      error: { type: 'unknown', message: 'No cached weather data found' },
    };
    return DailyForecastResultSchema.parse(result);
  }

  // Map and validate each cached entry
  const mapped = cached.map((cw: WeatherCache) => ({
    requestId,
    time: cw.updatedAt.toISOString(),
    temperatureMax: cw.temperature,
    temperatureMin: cw.feelsLike,
    precipitation: cw.precipitationProbability,
    conditions: {
      day: cw.weatherCode,
      night: cw.weatherCode,
    },
    rainAccumulationAvg: cw.rainAccumulationAvg ?? 0,
    rainAccumulationMax: cw.rainAccumulationMax ?? 0,
    rainAccumulationMin: cw.rainAccumulationMin ?? 0,
    rainAccumulationSum: cw.rainAccumulationSum ?? 0,
    sunriseTime: undefined,
    sunsetTime: undefined,
    moonriseTime: undefined,
    moonsetTime: undefined,
  }));

  // Validate the array as a whole
  const safe = DailyForecastResultSchema.safeParse({
    forecast: mapped,
    maxRainAccumulation: Math.max(...mapped.map((f) => f.rainAccumulationSum)),
  });

  if (!safe.success) {
    await log.error('Cached forecast validation failed', { errors: safe.error.format() });
    // Return a safe error result
    return {
      forecast: [],
      maxRainAccumulation: 0,
      error: { type: 'unknown', message: 'Cached forecast validation failed' },
    };
  }

  await log.info('Returning cached daily forecast', {
    count: mapped.length,
    location: locationToUse.name,
    data: safe.data,
  });
  return safe.data;
}

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

function generateMockForecast(requestId?: string): DailyForecastResult {
  const now = new Date();
  const forecast: DailyForecastPoint[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);

    forecast.push({
      requestId,
      time: date.toISOString().split('T')[0] + 'T11:00:00Z',
      temperatureMax: 65 + Math.random() * 20,
      temperatureMin: 45 + Math.random() * 15,
      precipitation: Math.random() * 30,
      conditions: {
        day: Math.floor(Math.random() * 1000) + 1000,
        night: Math.floor(Math.random() * 1000) + 1000,
      },
      rainAccumulationAvg: Math.random() * 0.1,
      rainAccumulationMax: Math.random() * 0.5,
      rainAccumulationMin: 0,
      rainAccumulationSum: Math.random() * 0.3,
      sunriseTime: date.toISOString().split('T')[0] + 'T11:30:00Z',
      sunsetTime: date.toISOString().split('T')[0] + 'T21:45:00Z',
      moonriseTime: date.toISOString().split('T')[0] + 'T23:15:00Z',
      moonsetTime: date.toISOString().split('T')[0] + 'T13:30:00Z',
    });
  }

  const maxRainAccumulation = Math.max(...forecast.map((f) => f.rainAccumulationSum));

  return {
    forecast,
    maxRainAccumulation,
    error: {
      type: 'unknown',
      message: 'Using mock weather data (API not called)',
    },
  };
}

export async function getDailyForecast(
  requestId?: string,
  location?: Location
): Promise<DailyForecastResult> {
  if (!requestId) requestId = generateUUID();
  const log = createLogger('app/lib/GetDailyForecast.ts', requestId);

  const useMockData = await isFeatureEnabled('WEATHER_MOCK_DATA');

  await log.info('getDailyForecast started', {
    useMockData,
    hasLocation: !!location,
  });

  if (useMockData) {
    return generateMockForecast(requestId);
  }

  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');

  const locationToUse = location || (await getActiveLocation());
  const locationParam = formatLocationForTomorrowIO(locationToUse);

  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${locationParam}&timesteps=1d&units=imperial&fields=temperatureMax,temperatureMin,precipitationProbability,weatherCodeMax,weatherCodeMin,rainAccumulationAvg,rainAccumulationMax,rainAccumulationMin,rainAccumulationSum,sunriseTime,sunsetTime,moonriseTime,moonsetTime&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      let errorType: 'rate_limit' | 'network' | 'api_error' | 'unknown' = 'api_error';
      let errorMessage = `API request failed with status ${res.status}`;

      if (res.status === 429) {
        errorType = 'rate_limit';
        errorMessage = 'Weather API rate limit exceeded. Please try again later.';
      } else if (res.status >= 500) {
        errorType = 'api_error';
        errorMessage = 'Weather service is temporarily unavailable.';
      }

      await log.error('Tomorrow.io API error', {
        status: res.status,
        errorType,
        errorMessage,
      });

      return {
        forecast: [],
        maxRainAccumulation: 0,
        error: {
          type: errorType,
          message: errorMessage,
          statusCode: res.status,
        },
      };
    }

    const data = await res.json();

    if (!data || !data.timelines || !Array.isArray(data.timelines.daily)) {
      await log.warn('Unexpected response format from Tomorrow.io', {
        hasData: !!data,
        hasTimelines: !!data?.timelines,
        isDailyArray: Array.isArray(data?.timelines?.daily),
      });
      return { forecast: [], maxRainAccumulation: 0 };
    }

    // Validate and map API daily entries
    const daily: RawDailyEntry[] = data.timelines?.daily;

    const mapped = daily.slice(0, 7).map((day): DailyForecastPoint => {
      return {
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
      };
    });

    const resultCandidate = {
      forecast: mapped,
      maxRainAccumulation: Math.max(...mapped.map((f) => f.rainAccumulationSum)),
    };

    const safe = DailyForecastResultSchema.safeParse(resultCandidate);
    if (!safe.success) {
      await log.error('API forecast validation failed', { errors: safe.error.format() });
      return {
        forecast: [],
        maxRainAccumulation: 0,
        error: { type: 'api_error', message: 'Invalid forecast data from API' },
      };
    }

    await log.info('Forecast data retrieved', {
      dailyEntries: daily.length,
      maxRainAccumulation: resultCandidate.maxRainAccumulation,
    });

    return safe.data;
  } catch (error) {
    await log
      .error('Tomorrow.io network error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      .catch(() => {
        console.warn('[getDailyForecast] Failed to log error:', error);
      });

    return {
      forecast: [],
      maxRainAccumulation: 0,
      error: {
        type: 'network',
        message: 'Network error occurred while fetching weather data',
        statusCode: 0,
      },
    };
  }
}
