import { db } from './db';
import {
  getActiveLocation,
  formatLocationForTomorrowIO,
  formatLocationForOSM,
  Location,
} from '../utils/locations';
import { isFeatureEnabled } from '../utils/featureFlags';
import { createLogger } from '../utils/logger';

function generateMockWeather(requestId: string, location: Location) {
  const temp = 65 + Math.random() * 20; // 65-85°F
  return {
    temperature: temp,
    feelsLike: temp + (Math.random() * 6 - 3), // ±3°F variation
    humidity: 50 + Math.random() * 30, // 50-80%
    windSpeed: 5 + Math.random() * 10, // 5-15 mph
    windGust: 8 + Math.random() * 15, // 8-23 mph
    precipitationProbability: Math.random() * 40, // 0-40%
    pressure: 29.5 + Math.random() * 1.0, // 29.5-30.5 inHg
    visibility: 5 + Math.random() * 5, // 5-10 miles
    conditions: {
      day: Math.floor(Math.random() * 1000) + 1000, // Weather codes 1000-1999
      night: Math.floor(Math.random() * 1000) + 1000,
    },
    rainAccumulationAvg: Math.random() * 0.1,
    rainAccumulationMax: Math.random() * 0.3,
    rainAccumulationMin: 0,
    rainAccumulationSum: Math.random() * 0.2,
    location: location.displayName,
    locationDetails: {
      city: location.displayName.split(',')[0],
      town: undefined,
      village: undefined,
      hamlet: undefined,
      county: undefined,
      displayName: location.displayName,
    },
    emailSent: false,
    lastEmailTimestamp: null,
    requestId,
  };
}

export async function fetchWeather(requestId?: string, location?: Location) {
  if (!requestId) requestId = 'requestid-not-passed';
  const log = createLogger('fetchWeather', requestId);

  const locationToUse = location || getActiveLocation();
  const useMockData = isFeatureEnabled('WEATHER_MOCK_DATA');

  if (useMockData) {
    return generateMockWeather(requestId, locationToUse);
  }

  const apiKey = process.env.TOMORROW_API_KEY;
  requestId = requestId ?? 'no-request-id';
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');

  const locationParam = formatLocationForTomorrowIO(locationToUse);
  const osmLocation = formatLocationForOSM(locationToUse);

  const url = `https://api.tomorrow.io/v4/weather/realtime?location=${locationParam}&units=imperial&fields=temperature,temperatureApparent,humidity,windSpeed,windGust,precipitationProbability,weatherCode,pressureSurfaceLevel,visibility,rainAccumulationAvg,rainAccumulationMax,rainAccumulationMin,rainAccumulationSum&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather');

  const data = await res.json();
  const values = data.data.values;
  const location2 = data.location ?? 'Unknown2';
  //const url2 = 'https://nominatim.openstreetmap.org/reverse?lat=40.10520&lon=-75.41404&format=json';
  const url2 = `https://nominatim.openstreetmap.org/reverse?lat=${osmLocation.lat}&lon=${osmLocation.lon}&format=json`;
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

    if (!res2.ok) {
      await log
        .error('Nominatim API error', {
          status: res2.status,
          statusText: res2.statusText,
        })
        .catch(() => console.warn('[fetchWeather] Failed to log Nominatim API error'));
      throw new Error('Failed to fetch location data');
    }

    const data2 = await res2.json();

    locationDetails = {
      city: data2.address?.city,
      town: data2.address?.town,
      village: data2.address?.village,
      hamlet: data2.address?.hamlet,
      county: data2.address?.county,
      displayName: data2.display_name,
    };

    // Fallback if Nominatim response is malformed
    if (!locationDetails.displayName) {
      locationDetails.displayName = locationToUse.name;
    }

    const locationName =
      locationDetails.city ??
      locationDetails.town ??
      locationDetails.village ??
      locationDetails.hamlet ??
      locationDetails.county ??
      'Unknown Location';
  } catch (error) {
    await log
      .error('Error fetching location data', {
        error: error instanceof Error ? error.message : String(error),
      })
      .catch(() => console.warn('[fetchWeather] Failed to log location fetch error'));

    // Fallback: use active location name
    locationDetails = {
      city: undefined,
      town: undefined,
      village: undefined,
      hamlet: undefined,
      county: undefined,
      displayName: locationToUse.name,
    };
  }

  await log
    .info('Weather data fetched successfully', {
      action: 'fetch',
      timestamp: new Date().toISOString(),
      location: location2,
    })
    .catch(() => console.warn('[fetchWeather] Failed to log weather fetch success'));

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
      location: locationToUse.name, // Add location identifier
    },
  });

  return {
    temperature: values.temperature,
    feelsLike: values.temperatureApparent ?? values.temperature,
    humidity: values.humidity,
    windSpeed: values.windSpeed,
    windGust: values.windGust,
    precipitationProbability: values.precipitationProbability,
    pressure: values.pressureSurfaceLevel ?? null,
    visibility: values.visibility ?? null,
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
