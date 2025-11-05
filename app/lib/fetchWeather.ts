import { db } from './db';
import { getActiveLocation, formatLocationForTomorrowIO, formatLocationForOSM } from '../utils/locations';

console.log(`[fetchWeather] Module loaded`);
export async function fetchWeather(requestId?: string) {
  if (!requestId) requestId = 'requestid-not-passed'; //generateUUID()
  console.log(`[fetchWeather] [${requestId}] Server function started`);

  const apiKey = process.env.TOMORROW_API_KEY;
  requestId = requestId ?? 'no-request-id';
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');

  // Get the active location from feature flags
  const activeLocation = getActiveLocation();
  const locationParam = formatLocationForTomorrowIO(activeLocation);
  const osmLocationParam = formatLocationForOSM(activeLocation);

  console.log(`[fetchWeather] [${requestId}] Using location: ${activeLocation.displayName} (${locationParam})`);

  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${locationParam}&units=imperial&apikey=${apiKey}`;

  console.log(
    `[fetchWeather] [${requestId}] Fetching weather data from API: ${url.replace(apiKey, '***')}`
  );

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  const values = data.data.values;
  const location2 = data.location ?? 'Unknown2';

  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: values`, values);
  console.log(`[fetchWeather] [${requestId}] Weather data fetched from API: location2`, location2);
  //const url2 = 'https://nominatim.openstreetmap.org/reverse?lat=40.10520&lon=-75.41404&format=json';
  const url2 = `https://nominatim.openstreetmap.org/reverse?lat=${osmLocationParam}&format=json`;
  console.log(`[fetchWeather] [${requestId}] Fetching location data from API: ${url2}`);
  let locationDetails = {
    city: undefined as string | undefined,
    town: undefined as string | undefined,
    village: undefined as string | undefined,
    hamlet: undefined as string | undefined,
    county: undefined as string | undefined,
    displayName: undefined as string | undefined,
  };

  try {
    const res2 = await fetch(url2, {
      headers: {
        'User-Agent': 'my-vercel-neon-app/1.0 (jonathankraus@comcast.net)',
      },
    });
    
    console.log(`[fetchWeather] [${requestId}] Nominatim API response status: ${res2.status}`);
    
    if (!res2.ok) {
      console.error(`[fetchWeather] [${requestId}] Nominatim API error: ${res2.status} ${res2.statusText}`);
      throw new Error('Failed to fetch location data');
    }

    const data2 = await res2.json();
    console.log(`[fetchWeather] [${requestId}] Location data fetch response:`, data2);
    console.log(`[fetchWeather] [${requestId}] Address object:`, data2.address);

    locationDetails = {
      city: data2.address?.city,
      town: data2.address?.town,
      village: data2.address?.village,
      hamlet: data2.address?.hamlet,
      county: data2.address?.county,
      displayName: data2.display_name,
    };

    const locationName =
      locationDetails.city ??
      locationDetails.town ??
      locationDetails.village ??
      locationDetails.hamlet ??
      locationDetails.county ??
      'Unknown Location';

    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: city`,
      locationDetails.city
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: town ${locationDetails.town}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: village ${locationDetails.village}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: hamlet ${locationDetails.hamlet}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: county ${locationDetails.county}`
    );

    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: locationName ${locationName}`
    );
    console.log(
      `[fetchWeather] [${requestId}] Location data fetched from API: display_name ${locationDetails.displayName}`
    );
  } catch (error) {
    console.error(`[fetchWeather] [${requestId}] Error fetching location data:`, error);
    
    // Fallback: use active location display name
    locationDetails = {
      city: undefined,
      town: undefined,
      village: undefined,
      hamlet: undefined,
      county: undefined,
      displayName: activeLocation.displayName,
    };
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

  // Weather logging (no automatic email sending)
  await db.weatherLog.create({
    data: {
      temperature: values.temperature,
      humidity: values.humidity,
      windSpeed: values.windSpeed,
      windGust: values.windGust,
      precipitationProbability: values.precipitationProbability,
      weatherCode: values.weatherCode,
      emailSent: false, // No automatic email
      requestId,
    },
  });
  console.log(`[${requestId}] 📝 Weather log created in DB`);

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
    locationDetails, // Add detailed location info
    emailSent: false, // No automatic email
    lastEmailTimestamp: null, // No automatic email
    requestId,
  };
}
