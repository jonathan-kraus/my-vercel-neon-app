// scripts/fetchWeatherHourly.ts
import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import pLimit from 'p-limit';

const prisma = new PrismaClient();

type Location = {
  name: string;
  lat: number;
  lon: number;
  locationDetails?: any;
};

const TOMORROW_API_KEY = process.env.TOMORROW_API_KEY;
if (!TOMORROW_API_KEY) {
  console.error('TOMORROW_API_KEY is not set');
  process.exit(1);
}

const LOCATION: Location = {
  name: process.env.LOCATION_NAME ?? 'kop',
  lat: Number(process.env.LOCATION_LAT ?? 40.104234),
  lon: Number(process.env.LOCATION_LON ?? -75.41397),
  locationDetails: {},
};

const HOURS = Number(process.env.HOURS ?? 24);
const RETENTION_DAYS = Number(process.env.RETENTION_DAYS ?? 30);
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 10);
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 500;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
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
  // adapt to Tomorrow.io response shape: intervals[].startTime and intervals[].values
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
    precipitationProbability: sanitizeNumber(
      values.precipitationProbability ?? values.precipitationProbability ?? 0
    ),
    pressure: values.pressureSeaLevel != null ? sanitizeNumber(values.pressureSeaLevel, 0) : null,
    visibility: values.visibility != null ? sanitizeNumber(values.visibility, 0) : null,
    weatherCode: Math.floor(sanitizeNumber(values.weatherCode ?? values.weather_code ?? 0)),
    rainAccumulationAvg: sanitizeNumber(
      values.rainAccumulationAvg ?? values.rainAccumulationAverage ?? 0
    ),
    rainAccumulationMax: sanitizeNumber(values.rainAccumulationMax ?? 0),
    rainAccumulationMin: sanitizeNumber(values.rainAccumulationMin ?? 0),
    rainAccumulationSum: sanitizeNumber(values.rainAccumulationSum ?? values.precipitation ?? 0),
    locationDetails: location.locationDetails ?? {},
  };
}

async function fetchHourlyTimelines(location: Location, hours = 24) {
  const url = new URL('https://api.tomorrow.io/v4/timelines');
  url.searchParams.set('location', `${location.lat},${location.lon}`);
  url.searchParams.set('timesteps', '1h');
  url.searchParams.set('startTime', 'now');
  url.searchParams.set('endTime', `+${hours}h`);
  // inside fetchHourlyTimelines: use this fields list (no 'precipitation')
  url.searchParams.set(
    'fields',
    [
      'temperature',
      'temperatureApparent',
      'humidity',
      'windSpeed',
      'windGust',
      'precipitationIntensity', // instantaneous intensity (if available)
      'precipitationProbability',
      'precipitationType',
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
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s
  console.log('Fetching URL:', url.toString(), 'with timeout', timeout);
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Tomorrow API ${res.status}: ${txt}`);
      }
      const json = await res.json();
      const intervals = json?.data?.timelines?.[0]?.intervals ?? [];
      return intervals;
    } catch (err: any) {
      const isLast = attempt === MAX_RETRIES;
      console.error(`Fetch attempt ${attempt + 1} failed: ${err?.message ?? err}`);
      if (isLast) throw err;
      const backoff = RETRY_BASE_MS * Math.pow(2, attempt);
      console.log(`Retrying in ${backoff}ms...`);
      await sleep(backoff);
    }
  }
  return [];
}

async function upsertIntervals(location: Location, intervals: any[]) {
  if (!intervals.length) return { processed: 0, succeeded: 0, failed: 0 };

  const limit = pLimit(BATCH_SIZE);
  const ops = intervals.map((interval) =>
    limit(async () => {
      const data = mapIntervalToWeatherHourly(location, interval);
      try {
        await prisma.weatherHourly.upsert({
          where: {
            location_forecastTime: {
              location: data.location,
              forecastTime: data.forecastTime,
            },
          },
          create: data,
          update: {
            ...data,
            updatedAt: new Date(),
          },
        });
        return { ok: true };
      } catch (err) {
        console.error('Upsert failed for', data.location, data.forecastTime, err);
        return { ok: false, error: err };
      }
    })
  );

  const results = await Promise.all(ops);
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;
  return { processed: results.length, succeeded, failed };
}

async function cleanupOldRows(locationName: string, retentionDays: number) {
  try {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const res = await prisma.weatherHourly.deleteMany({
      where: {
        location: locationName,
        forecastTime: { lt: cutoff },
      },
    });
    console.log(`Cleanup: deleted ${res.count} rows older than ${retentionDays} days`);
    return res.count;
  } catch (err) {
    console.error('Cleanup failed', err);
    return 0;
  }
}

async function refreshHourlyWeatherCache(location: Location, hours = 24, retentionDays = 30) {
  console.log(
    `Fetching ${hours}h hourly forecast for ${location.name} (${location.lat},${location.lon})`
  );
  const intervals = await fetchHourlyTimelines(location, hours);
  console.log(`Fetched ${intervals.length} intervals`);

  if (!intervals.length) {
    console.warn('No intervals returned, aborting upsert');
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  const upsertResult = await upsertIntervals(location, intervals);
  console.log('Upsert result', upsertResult);

  const deleted = await cleanupOldRows(location.name, retentionDays);

  return { ...upsertResult, deleted };
}

// CLI runner
if (require.main === module) {
  (async () => {
    try {
      const result = await refreshHourlyWeatherCache(LOCATION, HOURS, RETENTION_DAYS);
      console.log('Done', result);
    } catch (err) {
      console.error('refreshHourlyWeatherCache failed', err);
      process.exitCode = 1;
    } finally {
      await prisma.$disconnect();
    }
  })();
}

export { refreshHourlyWeatherCache };
