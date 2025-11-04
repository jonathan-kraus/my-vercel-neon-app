import { db } from './db';
import { triggerEmail } from '@/app/components/actions';
import { generateUUID } from '../../uuidj';

console.log(`[fetchWeather] Module loaded`);
export async function fetchWeather(requestId?: string) {
  if (!requestId) requestId = 'requestid-not-passed'; //generateUUID()
  console.log(`[fetchWeather] [${requestId}] Server function started`);

  const apiKey = process.env.TOMORROW_API_KEY;
  requestId = requestId ?? 'no-request-id';
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');
  //const url = `https://api.tomorrow.io/v4/weather/realtime?location=${zip}&units=imperial&apikey=${apiKey}`;
  const url = `https://api.tomorrow.io/v4/weather/realtime?location=40.10520,-75.41404&units=imperial&apikey=${apiKey}`;

  console.log(`[fetchWeather] [${requestId}] Fetching weather data from API: ${url}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  const values = data.data.values;
  const location2 = data.location ?? 'Unknown2';

  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: values`, values);
  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: location2`, location2);
  const url2 = 'https://nominatim.openstreetmap.org/reverse?lat=40.10520&lon=-75.41404&format=json';
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
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: city`,
      data2.address.city
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: town ${data2.address.town}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: village ${data2.address.village}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: hamlet ${data2.address.hamlet}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: county ${data2.address.county}`
    );

    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: locationName ${locationName}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: display_name ${data2.display_name}`
    );
  } catch (error) {
    console.error(`[fetchWeather] [${requestId}] Error fetching location data:`, error);
  }
  console.log(`[fetchWeather] [${requestId}] Preparing to log event to external logging service`);

  const severity = 'info';
  const source = 'fetchWeather';
  const message = `Weather data fetched successfully`;
  const metadata = { action: 'fetch', timestamp: new Date().toISOString(), location: location2 };

  await db.log.create({
    data: {
      severity,
      source,
      message,
      requestId,
      metadata: metadata ?? {},
      timestamp: new Date(),
    },
  });

  console.log(`[fetchWeather]  Weather data fetched for location2 `);

  // Always send email without throttling
  let emailSent = false;
  let lastEmailTimestamp = null;
  const now = new Date();
  try {
    await triggerEmail('Weather', requestId, location2 ?? 'Weather Location', values.temperature);
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
    console.log(`[${requestId}] 📝 Weather log with ID 1 updated in DB`);
    emailSent = true;
    lastEmailTimestamp = now.toISOString();

    console.log(`[${requestId}] ✅ Weather email sent and log created`);
  } catch (err) {
    console.error(`[${requestId}] ❌ Email failed:`, err);
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
