import { NextResponse } from 'next/server';
import { fetchWeather } from '@/app/lib/fetchWeather';
import { randomUUID } from 'crypto';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zip = searchParams.get('zip') ?? '02445'; // fallback ZIP
  const requestId = randomUUID();

  console.log(`[${requestId}] getWeather triggered for ZIP: ${zip}`);

  try {
    const weather = await fetchWeather(zip);
    return NextResponse.json(weather);
  } catch (err) {
    console.error(`[${requestId}] ❌ Error fetching weather for ZIP ${zip}:`, err);
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
  }
}
