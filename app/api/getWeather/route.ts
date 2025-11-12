import { NextResponse } from 'next/server';
import { fetchWeather } from '@/app/lib/fetchWeather';
import { generateUUID } from '@/uuidj';
import { getLocationByName } from '@/app/utils/locations';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/getWeather/route.ts', requestId);

  const url = new URL(request.url);
  const locationName = url.searchParams.get('location');
  const location = locationName ? getLocationByName(locationName) : undefined;

  try {
    const weather = await fetchWeather(requestId, location);
    return NextResponse.json({ ...weather, requestId });
  } catch (err) {
    await log.error('Error fetching weather', { error: String(err) });
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
