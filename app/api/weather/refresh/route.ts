// app/api/weather/refresh/route.ts
import { NextResponse } from 'next/server';
import { refreshHourlyWeatherCache } from '@/app/lib/weatherCache';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';
import error from 'next/error';

// Optional simple auth: set REFRESH_API_KEY in env and send header "x-refresh-key"
const EXPECTED_KEY = process.env.REFRESH_API_KEY;
const requestId = generateUUID();
const log = createLogger('app/api/weather/refresh/route.ts', requestId);
const LOCATION = {
  name: process.env.LOCATION_NAME ?? 'kop',
  lat: Number(process.env.LOCATION_LAT ?? 40.104234),
  lon: Number(process.env.LOCATION_LON ?? -75.41397),
  locationDetails: {},
};

export async function GET(request: Request) {
  try {
    // optional auth
    if (EXPECTED_KEY) {
      const key = request.headers.get('x-refresh-key') ?? '';
      if (key !== EXPECTED_KEY) {
        return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
      }
    }

    const hours = Number(process.env.HOURS ?? 24);
    const retention = Number(process.env.RETENTION_DAYS ?? 30);

    const result = await refreshHourlyWeatherCache(LOCATION, hours, retention);
    log.info('weather refresh succeeded', {
      action: 'weather_refresh',
      result,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    log.error('weather refresh failed', err as error);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
