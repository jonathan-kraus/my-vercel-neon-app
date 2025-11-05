'use server';

import { generateUUID } from '../../uuidj';
import { getActiveLocation, formatLocationForTomorrowIO, Location } from '../utils/locations';
import { isFeatureEnabled } from '../utils/featureFlags';

export type DailyForecastPoint = {
  requestId?: string;
  time: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  conditions: {
    day: number;
    night: number;
  };
  rainAccumulationAvg: number;
  rainAccumulationMax: number;
  rainAccumulationMin: number;
  rainAccumulationSum: number;
  sunriseTime?: string;
  sunsetTime?: string;
  moonriseTime?: string;
  moonsetTime?: string;
};

export type DailyForecastResult = {
  forecast: DailyForecastPoint[];
  maxRainAccumulation: number;
  error?: {
    type: 'rate_limit' | 'network' | 'api_error' | 'unknown';
    message: string;
    statusCode?: number;
  };
};
type RawDailyEntry = {
  time: string;
  values: {
    temperatureMax: number;
    temperatureMin: number;
    precipitationProbability: number;
    weatherCodeMax: number;
    weatherCodeMin: number;
    rainAccumulationAvg: number;
    rainAccumulationMax: number;
    rainAccumulationMin: number;
    rainAccumulationSum: number;
    sunriseTime?: string;
    sunsetTime?: string;
    moonriseTime?: string;
    moonsetTime?: string;
  };
};

function generateMockForecast(requestId?: string): DailyForecastResult {
  const now = new Date();
  const forecast: DailyForecastPoint[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // Realistic sunrise/sunset times for EST/EDT (adjusted for local timezone)
    // Sunrise around 6:30 AM EST = 11:30 UTC
    // Sunset around 4:45 PM EST = 21:45 UTC (16:45 + 5 hours)
    forecast.push({
      requestId,
      time: date.toISOString().split('T')[0] + 'T11:00:00Z',
      temperatureMax: 65 + Math.random() * 20, // 65-85°F
      temperatureMin: 45 + Math.random() * 15, // 45-60°F
      precipitation: Math.random() * 30, // 0-30% chance
      conditions: {
        day: Math.floor(Math.random() * 1000) + 1000, // Weather codes 1000-1999
        night: Math.floor(Math.random() * 1000) + 1000,
      },
      rainAccumulationAvg: Math.random() * 0.1,
      rainAccumulationMax: Math.random() * 0.5,
      rainAccumulationMin: 0,
      rainAccumulationSum: Math.random() * 0.3,
      sunriseTime: date.toISOString().split('T')[0] + 'T11:30:00Z', // ~6:30 AM EST
      sunsetTime: date.toISOString().split('T')[0] + 'T21:45:00Z', // ~4:45 PM EST
      moonriseTime: date.toISOString().split('T')[0] + 'T23:15:00Z', // ~6:15 PM EST
      moonsetTime: date.toISOString().split('T')[0] + 'T13:30:00Z', // ~8:30 AM EST
    });
  }
  
  const maxRainAccumulation = Math.max(...forecast.map(f => f.rainAccumulationSum));
  
  return { 
    forecast, 
    maxRainAccumulation,
    error: {
      type: 'unknown',
      message: 'Using mock weather data (API not called)'
    }
  };
}

export async function getDailyForecast(requestId?: string, location?: Location): Promise<DailyForecastResult> {
  console.log(`[getDailyForecast] [${requestId}] Function started`);
  
  // Check if mock data is enabled
  const useMockData = isFeatureEnabled('WEATHER_MOCK_DATA');
  console.log(`[getDailyForecast] [${requestId}] Mock data enabled: ${useMockData}`);
  console.log(`[getDailyForecast] [${requestId}] Environment variable FEATURE_WEATHER_MOCK_DATA: ${process.env.FEATURE_WEATHER_MOCK_DATA}`);
  
  if (useMockData) {
    console.log(`[getDailyForecast] [${requestId}] Using mock weather data`);
    return generateMockForecast(requestId);
  }
  
  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) throw new Error('TOMORROW_API_KEY not set in environment variables');

  console.log(`[getDailyForecast] [${requestId}] Using API key: ${apiKey.slice(0, 4)}...`);

  if (!requestId) requestId = generateUUID();
  console.log(`[getDailyForecast] [${requestId}] getDailyForecast started`);

  // Get the location to use (passed parameter or active location from feature flags)
  const locationToUse = location || getActiveLocation();
  const locationParam = formatLocationForTomorrowIO(locationToUse);
  console.log(
    `[getDailyForecast] [${requestId}] Using location: ${locationToUse.displayName} (${locationParam})`
  );

  const url = `https://api.tomorrow.io/v4/weather/forecast?location=${locationParam}&timesteps=1d&units=imperial&fields=temperatureMax,temperatureMin,precipitationProbability,weatherCodeMax,weatherCodeMin,rainAccumulationAvg,rainAccumulationMax,rainAccumulationMin,rainAccumulationSum,sunriseTime,sunsetTime,moonriseTime,moonsetTime&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[Tomorrow.io] ❌ HTTP error: ${res.status}`);
      
      let errorType: 'rate_limit' | 'network' | 'api_error' | 'unknown' = 'api_error';
      let errorMessage = `API request failed with status ${res.status}`;
      
      if (res.status === 429) {
        errorType = 'rate_limit';
        errorMessage = 'Weather API rate limit exceeded. Please try again later.';
      } else if (res.status >= 500) {
        errorType = 'api_error';
        errorMessage = 'Weather service is temporarily unavailable.';
      }
      
      return { 
        forecast: [], 
        maxRainAccumulation: 0,
        error: {
          type: errorType,
          message: errorMessage,
          statusCode: res.status
        }
      };
    }

    const data = await res.json();

    if (!data || !data.timelines || !Array.isArray(data.timelines.daily)) {
      console.warn(`[Tomorrow.io] ⚠️ Unexpected response format`, data);
      return { forecast: [], maxRainAccumulation: 0 };
    }
    console.log(`[getDailyForecast] [${requestId}] Data fetched from API:`, data);

    console.log(
      `[GetDailyForecast] [${requestId}] Forecast response:`,
      JSON.stringify(data, null, 2)
    );
    const daily: RawDailyEntry[] = data.timelines?.daily;

    console.log(
      `[${requestId}] Raw daily forecastvalues:`,
      daily.map((d) => d.values)
    );
    const maxRainAccumulation = Math.max(
      ...daily.map((d) => d.values.rainAccumulationSum).filter((val) => typeof val === 'number')
    );
    console.log(`[getDailyForecast] [${requestId}] Max rainAccumulationSum:`, maxRainAccumulation);

    console.log(`[getDailyForecast] [${requestId}] JJJ daily entries:`, daily);
    const forecast = daily.slice(0, 7).map(
      (day): DailyForecastPoint => {
        // Log the raw sun/moon times from Tomorrow.io
        console.log(`[getDailyForecast] [${requestId}] Day ${day.time}:`, {
          sunriseTime: day.values?.sunriseTime,
          sunsetTime: day.values?.sunsetTime,
          moonriseTime: day.values?.moonriseTime,
          moonsetTime: day.values?.moonsetTime,
        });
        
        return {
          requestId,
          time: day.time,
          temperatureMax: day.values?.temperatureMax ?? 0,
          temperatureMin: day.values?.temperatureMin ?? 0,
          precipitation: day.values?.precipitationProbability ?? 0,
          conditions: {
            day: day.values.weatherCodeMax ?? -1,
            night: day.values.weatherCodeMin ?? -1,
          },
          rainAccumulationAvg: day.values?.rainAccumulationAvg ?? 0,
          rainAccumulationMax: day.values?.rainAccumulationMax ?? 0,
          rainAccumulationMin: day.values?.rainAccumulationMin ?? 0,
          rainAccumulationSum: day.values?.rainAccumulationSum ?? 0,
          sunriseTime: day.values?.sunriseTime,
          sunsetTime: day.values?.sunsetTime,
          moonriseTime: day.values?.moonriseTime,
          moonsetTime: day.values?.moonsetTime,
        };
      }
    );

    return { forecast, maxRainAccumulation };
  } catch (error) {
    console.error(`[Tomorrow.io] ❌ Network error:`, error);
    return {
      forecast: [],
      maxRainAccumulation: 0,
      error: {
        type: 'network',
        message: 'Network error occurred while fetching weather data',
        statusCode: 0
      }
    };
  }
}
