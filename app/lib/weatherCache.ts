// lib/weatherCache.ts
import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

type Location = {
  name: string;
  lat: number;
  lon: number;
  locationDetails?: any;
};

const TOMORROW_API_KEY = process.env.TOMORROW_API_KEY;
if (!TOMORROW_API_KEY) {
  throw new Error('TOMORROW_API_KEY is not set');
}

function sanitizeNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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
    temperature: sanitizeNumber(values.temperature ?? values.temp ?? 0),
    feelsLike: sanitizeNumber(values.temperatureApparent ?? values.feelsLike ?? 0),
    humidity: sanitizeNumber(values.humidity ?? 0),
    windSpeed: sanitizeNumber(values.windSpeed ?? values.wind_speed ?? 0),
    windGust: sanitizeNumber(values.windGust ?? 0),
    precipitationProbability: sanitizeNumber(values.precipitationProbability ?? 0),
    pressure: values.pressureSeaLevel != null ? sanitizeNumber(values.pressureSeaLevel, 0) : null,
    visibility: values.visibility != null ? sanitizeNumber(values.visibility, 0) : null,
    weatherCode: Math.floor(sanitizeNumber(values.weatherCode ?? 0)),
    rainAccumulationAvg: sanitizeNumber(
      values.rainAccumulationAvg ?? values.rainAccumulationAverage ?? 0
    ),
    rainAccumulationMax: sanitizeNumber(values.rainAccumulationMax ?? 0),
    rainAccumulationMin: sanitizeNumber(values.rainAccumulationMin ?? 0),
    rainAccumulationSum: sanitizeNumber(values.rainAccumulationSum ?? values.precipitation ?? 0),
    locationDetails: location.locationDetails ?? {},
  };
}

async function fetchHourlyTimelines(location: Location, hours = 24, timeoutMs = 15000) {
  const url = new URL('https://api.tomorrow.io/v4/timelines');
  url.searchParams.set('location', `${location.lat},${location.lon}`);
  url.searchParams.set('timesteps', '1h');
  url.searchParams.set('startTime', 'now');
  url.searchParams.set('endTime', `+${hours}h`);
  url.searchParams.set(
    'fields',
    [
      'temperature',
      'temperatureApparent',
      'humidity',
      'windSpeed',
      'windGust',
      'precipitation',
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
