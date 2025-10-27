'use server';

import { db } from '@/app/lib/db';
import { triggerEmail } from '../components/actions';

// Define the type for the weather response
type WeatherResponse = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitationProbability: number;
  conditions: { day: number; night: number };
  emailSent?: boolean;
  lastEmailTimestamp: string | null;
  requestId?: string;
  locationName?: string;
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
};

// Define the build check flag once at the top
const isBuilding = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_URL === undefined;

// =========================================================
// SERVER ACTION 1: getWeather (Contains Conditional Side Effects)
// =========================================================
export async function getWeather(): Promise<WeatherResponse> {
  const requestId = crypto.randomUUID();
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = process.env.JZIP || '02445';

  // **Data Fetching Setup (Runs Unconditionally)**
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=40.10520,-75.41404&units=imperial&apikey=${apiKey}`;

  console.log(`[getWeather] [${requestId}] Server function started at ${new Date().toISOString()}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  const values = data.data.values;
  const now = new Date();
  console.log(`[getWeather] [${requestId}] Raw weather API response:`, data);

  let emailSent = false;
  let lastEmailTimestamp: string | null = null;
  let hoursSinceLast = Infinity;
  let latestLog: { createdAt: Date; id: number } | null = null;

  // **Side Effects Block (CONDITIONAL EXECUTION)**
  // Only runs if NOT currently in the Vercel build process.
  if (!isBuilding) {
    console.log('--- Checking for DB/Email side effects (RUNTIME ONLY) ---');

    // DB READ
    latestLog = await db.weatherLog.findFirst({
      where: { emailSent: true },
      orderBy: { createdAt: 'desc' },
    });

    hoursSinceLast = latestLog
      ? (now.getTime() - latestLog.createdAt.getTime()) / 3600000
      : Infinity;

    if (latestLog) {
      lastEmailTimestamp = latestLog.createdAt.toISOString();
    }

    console.log('Hours since last email log:', hoursSinceLast);

    if (hoursSinceLast > 2) {
      try {
        const subject = `Weather Update for ${data.location?.name ?? 'Unknown'}`;

        // EMAIL SEND
        await triggerEmail(
          'Weather',
          latestLog ? latestLog.id.toString() : undefined,
          subject,
          values.temperature
        );

        // DB WRITE (CREATE)
        await db.weatherLog.create({
          data: {
            temperature: values.temperature,
            humidity: values.humidity,
            windSpeed: values.windSpeed,
            windGust: values.windGust,
            precipitationProbability: values.precipitationProbability,
            weatherCode: values.weatherCode,
            emailSent: true,
          },
        });

        // DB WRITE (UPDATE)
        await db.weatherLog.update({
          where: { id: 1 },
          data: {
            temperature: data.temperature,
            humidity: data.humidity,
            windSpeed: data.windSpeed,
            windGust: data.windGust,
            precipitationProbability: data.precipitationProbability,
            weatherCode: data.weatherCode,
            createdAt: new Date(),
          },
        });

        emailSent = true;
        lastEmailTimestamp = now.toISOString();

        console.log('✅ Weather email sent and log created');
      } catch (err) {
        console.error('❌ Email failed:', err);
      }
    } else {
      console.log('⏱️ Email already sent within the last 24 hours');
    }
  } else {
    console.log('--- DB/EMAIL Side effects skipped during Vercel build ---');
  }

  // **Final Return (Runs Unconditionally)**
  const locationName = data.location?.name ?? 'Unknown';
  console.log(`[getWeather] [${requestId}] Weather data fetched for ${locationName}:`, values);

  return {
    temperature: values.temperature,
    humidity: values.humidity,
    windSpeed: values.windSpeed,
    windGust: values.windGust,
    precipitationProbability: values.precipitationProbability,
    conditions: {
      day: values.weatherCode ?? -1,
      night: values.weatherCode ?? -1,
    },
    rainAccumulationAvg: values.rainAccumulationAvg,
    rainAccumulationMax: values.rainAccumulationMax,
    rainAccumulationMin: values.rainAccumulationMin,
    rainAccumulationSum: values.rainAccumulationSum,
    locationName,
    // Use the values from the block if run, otherwise defaults (false/null)
    emailSent,
    lastEmailTimestamp,
    requestId,
  };
}

// =========================================================
// SERVER ACTION 2: getHourlyForecast (Exported to fix import error)
// =========================================================
type HourlyForecastEntry = {
  time: string;
  values: {
    temperature: number;
    precipitationProbability: number;
    windSpeed: number;
  };
};

export async function getHourlyForecast(): Promise<
  { time: string; temperature: number; precipitation: number; windSpeed: number }[]
> {
  const apiKey = process.env.TOMORROW_API_KEY;
  // This function currently has no side effects (only a read/fetch), so no build check is necessary.
  const url = `https://api.tomorrow.io/v4/weather/forecast?location=40.10520,-75.41404&timesteps=1h&units=imperial&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch forecast');

  const data = await res.json();
  const hourly: HourlyForecastEntry[] = data.timelines.hourly;

  return hourly.slice(0, 12).map((hour) => ({
    time: hour.time,
    temperature: hour.values.temperature,
    precipitation: hour.values.precipitationProbability,
    windSpeed: hour.values.windSpeed,
  }));
}
