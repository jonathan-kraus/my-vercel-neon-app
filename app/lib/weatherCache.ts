// lib/weatherCache.ts
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

type Location = {
  name: string;
  lat: number;
  lon: number;
  locationDetails?: any;
};

function getTomorrowApiKey(): string {
  const key = process.env.TOMORROW_API_KEY;
  if (!key) throw new Error('TOMORROW_API_KEY is not set');
  return key;
}

function sanitizeNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
/**
 * Try multiple keys on a values object and return the first finite number found.
 * If none found, return fallback.
 */
function getNumber(values: any, keys: string[], fallback = 0): number {
  if (!values) return fallback;
  for (const k of keys) {
    if (values[k] !== undefined && values[k] !== null) {
      const n = Number(values[k]);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}
function mapIntervalToWeatherHourly(
  location: Location,
  interval: any
): Prisma.WeatherHourlyCreateInput {
  const timeStr = interval.startTime ?? interval.time ?? interval.start;
  const forecastTime = new Date(timeStr);
  const values = interval.values ?? interval;

  return {
    location: location.name,
    forecastTime,
    temperature: getNumber(values, ['temperature', 'temp'], 0),
    feelsLike: getNumber(values, ['temperatureApparent', 'feelsLike', 'apparentTemperature'], 0),
    humidity: getNumber(values, ['humidity'], 0),
    windSpeed: getNumber(values, ['windSpeed', 'wind_speed'], 0),
    windGust: getNumber(values, ['windGust', 'wind_gust'], 0),
    precipitationProbability: getNumber(
      values,
      ['precipitationProbability', 'precipitation_probability'],
      0
    ),
    pressure: (() => {
      const p = getNumber(values, ['pressureSeaLevel', 'pressure'], NaN);
      return Number.isFinite(p) ? p : null;
    })(),
    visibility: (() => {
      const v = getNumber(values, ['visibility'], NaN);
      return Number.isFinite(v) ? v : null;
    })(),
    weatherCode: Math.floor(getNumber(values, ['weatherCode', 'weather_code'], 0)),
    rainAccumulationAvg: getNumber(values, ['rainAccumulationAvg', 'rainAccumulationAverage'], 0),
    rainAccumulationMax: getNumber(values, ['rainAccumulationMax'], 0),
    rainAccumulationMin: getNumber(values, ['rainAccumulationMin'], 0),
    rainAccumulationSum: getNumber(
      values,
      [
        'rainAccumulationSum',
        'rainAccumulation',
        'precipitationAccumulation',
        'precipitationIntensity',
      ],
      0
    ),
    locationDetails: location.locationDetails ?? {},
  };
}

/**
 * Fetch hourly timelines from Tomorrow.io
 * - Uses ISO 8601 endTime (UTC)
 * - Logs the final URL for debugging
 * - Uses AbortController for timeout
 */
async function fetchHourlyTimelines(location: Location, hours = 24, timeoutMs = 15000) {
  const url = new URL('https://api.tomorrow.io/v4/timelines');
  const TOMORROW_API_KEY = getTomorrowApiKey();
  url.searchParams.set('location', `${location.lat},${location.lon}`);
  url.searchParams.set('timesteps', '1h');

  // startTime can be 'now'; endTime must be an ISO 8601 timestamp
  url.searchParams.set('startTime', 'now');
  const endIso = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  url.searchParams.set('endTime', endIso);

  url.searchParams.set(
    'fields',
    [
      'temperature',
      'temperatureApparent',
      'humidity',
      'windSpeed',
      'windGust',
      'precipitationIntensity',
      'precipitationProbability',
      'pressureSeaLevel',
      'visibility',
      'weatherCode',
      'rainAccumulationAvg',
      'rainAccumulationMax',
      'rainAccumulationMin',
      'rainAccumulationSum',
    ].join(',')
  );
  url.searchParams.set('units', 'metric');
  url.searchParams.set('apikey', TOMORROW_API_KEY as string);

  // Log the final URL for debugging invalid-parameter errors
  console.log('Tomorrow API URL:', url.toString());

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Tomorrow API ${res.status}: ${txt}`);
    }
    const json = await res.json();
    return json?.data?.timelines?.[0]?.intervals ?? [];
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

async function upsertIntervals(location: Location, intervals: any[], batchSize = 10) {
  if (!intervals.length) return { processed: 0, succeeded: 0, failed: 0 };

  const chunks: any[][] = [];
  for (let i = 0; i < intervals.length; i += batchSize)
    chunks.push(intervals.slice(i, i + batchSize));

  let succeeded = 0;
  let failed = 0;

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (interval) => {
        const data = mapIntervalToWeatherHourly(location, interval);
        try {
          await prisma.weatherHourly.upsert({
            where: {
              location_forecastTime: { location: data.location, forecastTime: data.forecastTime },
            },
            create: data,
            update: { ...data, updatedAt: new Date() },
          });
          succeeded += 1;
        } catch (err) {
          console.error('Upsert failed for', data.location, data.forecastTime, err);
          failed += 1;
        }
      })
    );
  }

  return { processed: intervals.length, succeeded, failed };
}

async function cleanupOldRows(locationName: string, retentionDays = 30) {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const res = await prisma.weatherHourly.deleteMany({
    where: { location: locationName, forecastTime: { lt: cutoff } },
  });
  return res.count;
}

export async function refreshHourlyWeatherCache(
  location: Location,
  hours = 24,
  retentionDays = 30,
  batchSize = 10
) {
  console.log(`refreshHourlyWeatherCache: fetching ${hours}h for ${location.name}`);
  const intervals = await fetchHourlyTimelines(location, hours);
  console.log(`refreshHourlyWeatherCache: fetched ${intervals.length} intervals`);
  if (!intervals.length) return { processed: 0, succeeded: 0, failed: 0, deleted: 0 };

  const upsertResult = await upsertIntervals(location, intervals, batchSize);
  const deleted = await cleanupOldRows(location.name, retentionDays);

  return { ...upsertResult, deleted };
}
