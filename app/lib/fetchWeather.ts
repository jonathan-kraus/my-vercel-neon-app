//import { PrismaClient } from '@prisma/client';
import { db } from './db';
import { triggerEmail } from '@/app/components/actions';

console.log(`[fetchWeather] Module loaded`);
export async function fetchWeather(requestId?: string) {
  if (!requestId) requestId = 'requestid-not-passed'; //crypto.randomUUID()
  console.log(`[fetchWeather] [${requestId}] Server function started`);

//const prisma = new PrismaClient();

  const apiKey = process.env.TOMORROW_API_KEY;
  requestId = requestId ?? 'no-request-id';
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');
  //const zip = '02245'; // Brookline, MA ZIP code

  //const url = `https://api.tomorrow.io/v4/weather/realtime?location=${zip}&units=imperial&apikey=${apiKey}`;
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=42.3317,-71.1212&units=imperial&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  const values = data.data.values;
  const location1 = data.location?.address ?? 'Unknown1';
  const location2 = data.location ?? 'Unknown2';
  
  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: values`, values);
  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: location1`, location1);
  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: location2`, location2);

  const logEvent = async () => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: '[fetchWeather]',
          message: `Weather data fetched for ${location2}`,
          requestId: requestId, // or generate dynamically
          metadata: { userAction: 'fetch' },
        }),
      });
    } catch (error) {
      console.error(`[fetchWeather] [${requestId}] Failed to log event:`, error);
    }
  };

  logEvent();
  console.log(`[fetchWeather] [${requestId}] Weather data fetched for ${locationName}`);
  
  const now = new Date();

  let emailSent = false;
  let lastEmailTimestamp: string | null = null;

  const latestLog = await db.weatherLog.findFirst({
    where: { emailSent: true },
    orderBy: { createdAt: 'desc' },
  });

  const hoursSinceLast = latestLog
    ? (now.getTime() - latestLog.createdAt.getTime()) / 3600000
    : Infinity;

  if (latestLog) {
    lastEmailTimestamp = latestLog.createdAt.toISOString();
  }

  console.log(`[${requestId}] Hours since last email log: ${hoursSinceLast}`);

  if (hoursSinceLast > 4) {
    try {
      await triggerEmail("Weather", requestId);
      console.log(`[${requestId}] 📧 Weather email triggered`);
      await db.weatherLog.create({
        data: {
          temperature: values.temperature,
          humidity: values.humidity,
          windSpeed: values.windSpeed,
          windGust: values.windGust,
          precipitationProbability: values.precipitationProbability,
          weatherCode: values.weatherCode,
          emailSent: true,
          requestId, // 👈 logged here
        },
      });
      console.log(`[${requestId}] 📝 Weather log created in DB`);
      await db.weatherLog.update({
        where: { id: 1 },
        data: {
          temperature: values.temperature,
          humidity: values.humidity,
          windSpeed: values.windSpeed,
          windGust: values.windGust,
          precipitationProbability: values.precipitationProbability,
          weatherCode: values.weatherCode,
          createdAt: now,
          requestId, // 👈 logged here  
        },
      });
      console.log(`[${requestId}] 📝 Weather log with ID 1 updated in DB`);
      emailSent = true;
      lastEmailTimestamp = now.toISOString();

      console.log(`[${requestId}] ✅ Weather email sent and log created`);
    } catch (err) {
      console.error(`[${requestId}] ❌ Email failed:`, err);
    }
  } else {
    console.log(`[${requestId}] ⏱️ Email already sent within the last 4 hours`);
  }

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
  rainAccumulationAvg: values.rainAccumulationAvg ?? 0,
  rainAccumulationMax: values.rainAccumulationMax ?? 0,
  rainAccumulationMin: values.rainAccumulationMin ?? 0,
  rainAccumulationSum: values.rainAccumulationSum ?? 0,
  locationName: locationName ?? 'Unknown',
  emailSent,
  lastEmailTimestamp,
  requestId,
};
}