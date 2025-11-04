import { NextResponse } from 'next/server';
import { fetchWeather } from '@/app/lib/fetchWeather';
import { generateUUID } from '../../../uuidj';
console.log('[build] Generating /getWeather');
export async function GET() {
  const requestId = generateUUID();
  console.log(`[getWeather] API route started at ${new Date().toISOString()}`);

  try {
    const weather = await fetchWeather(requestId);
    return NextResponse.json({ ...weather, requestId });
  } catch (err) {
    console.error(`[getWeather] ❌ Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
