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


  console.log(`[fetchWeather] [${requestId}] Fetching weather data from API: ${url}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  const values = data.data.values;
  const location2 = data.location ?? 'Unknown2';
  
  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: values`, values);
  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: location2`, location2);
  const url2 = "https://nominatim.openstreetmap.org/reverse?lat=42.3317&lon=-71.1212&format=json";
  console.log(`[fetchWeather] [${requestId}] Fetching location data from API: ${url2}`);
  try {
    
    const res2 = await fetch(url2, {
  headers: {
    'User-Agent': 'my-vercel-neon-app/1.0 (jonathankraus@comcast.net)',
  },
});
  if (!res2.ok) throw new Error('Failed to fetch location data');

  const data2 = await res2.json();
  console.log(`[fetchWeather] [${requestId}] Location data fetch response: json`, data2);
  const locationName =
  data2.address?.city ??
  data2.address?.town ??
  data2.address?.village ??
  data2.address?.hamlet ??
  data2.address?.county ??
  'Unknown Location';


  console.log(`[fetchWeather] [${requestId}] Location data fetched from API: locationName ${locationName}`);
  console.log(`[fetchWeather] [${requestId}] Location data fetched from API: display_name ${data2.display_name}`);


  } catch (error) {
    console.error(`[fetchWeather] [${requestId}] Error fetching location data:`, error);
  }
  
  const logEvent = async () => {
    try {
      await fetch('https://kraus.my.id/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: '[fetchWeather]',
          message: `Weather data fetched for ${JSON.stringify(location2)}`,
          requestId: requestId, // or generate dynamically
          metadata: { userAction: 'fetch' },
        }),
      });
    } catch (error) {
      console.error(`[fetchWeather] [${requestId}] Failed to log event:`, error);
    }
  };

  logEvent();

  console.log(`[fetchWeather] [${requestId}] Weather data fetched for location2 ${JSON.stringify(location2)}`);

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
  location: location2 ?? 'Unknown',
  emailSent,
  lastEmailTimestamp,
  requestId,
};
}