import { NextResponse } from 'next/server';
import { fetchWeather } from '@/app/lib/fetchWeather';

export async function GET() {
  console.log(`[getWeather] API route started at ${new Date().toISOString()}`);
  try {
    const weather = await fetchWeather();
    return NextResponse.json(weather);
  } catch (err) {
    console.error('❌ Error in getWeather API:', err);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}

