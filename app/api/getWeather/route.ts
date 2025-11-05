import { NextResponse } from 'next/server';
import { fetchWeather } from '@/app/lib/fetchWeather';
import { generateUUID } from '@/uuidj';
import { getLocationByName } from '@/app/utils/locations';
console.log('[build] Generating /getWeather');
export async function GET(request: Request) {
  const requestId = generateUUID();
  console.log(`[getWeather] API route started at ${new Date().toISOString()}`);

  const url = new URL(request.url);
  const locationName = url.searchParams.get('location');
  const location = locationName ? getLocationByName(locationName) : undefined;

  try {
    const weather = await fetchWeather(requestId, location);
    return NextResponse.json({ ...weather, requestId });
  } catch (err) {
    console.error(`[getWeather] ❌ Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
