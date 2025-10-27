'use server';
import { db } from '@/app/lib/db';
import { triggerEmail } from '../components/actions';

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

// =========================================================
// 🎯 FIX 1: Define the check outside the main function
// =========================================================
const isBuilding = process.env.VERCEL_ENV === 'production' && process.env.VERCEL_URL === undefined;

export async function getWeather(): Promise<WeatherResponse> {
  const requestId = crypto.randomUUID();
  const apiKey = process.env.TOMORROW_API_KEY;
  const zip = process.env.JZIP || '02445';

  const url = `https://api.tomorrow.io/v4/weather/realtime?location=40.10520,-75.41404&units=imperial&apikey=${apiKey}`;

  // Console logs are side effects, but generally safe to keep for debugging,
  // though they should be commented out for production if verbose.
  console.log(`[getWeather] [${requestId}] Server function started at ${new Date().toISOString()}`);
  if (typeof window !== 'undefined') {
    console.log(`[getWeather] [${requestId}] Running on the client zip: ${zip}`);
  } else {
    console.log(`[getWeather] [${requestId}] Running on the server zip: ${zip}`);
  }

  // =========================================================
  // Data Fetching (MUST RUN during build to get data for page)
  // =========================================================
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

  // =========================================================
  // 🎯 FIX 2: Conditionally run the DB/Email side-effect block
  // =========================================================
  if (!isBuilding) {
    // This entire block of logic involves DB READS, DB WRITES, and EMAIL TRIGGERS,
    // and MUST be conditional to prevent build-time side effects.

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
    // Log for clarity during build
    console.log('--- DB/EMAIL Side effects skipped during Vercel build ---');
  }

  // =========================================================
  // Final Return (MUST RUN during build and runtime)
  // =========================================================
  const locationName = data.location?.name ?? 'Unknown';
  console.log(`Weather data fetched [${requestId}] for ${locationName}:`, values);
  console.log(`[getWeather] [${requestId}] Weather for ZIP ${zip} resolved to ${locationName}`);

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
    emailSent,
    lastEmailTimestamp,
    requestId,
  };
}

// ... (getHourlyForecast function remains unchanged as it has no side effects)
