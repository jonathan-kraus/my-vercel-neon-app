import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';

export async function GET() {
  const requestId = crypto.randomUUID();
  console.log(`[getDailyForecast] API route started at ${new Date().toISOString()}`);

  try {
    const forecast = await getDailyForecast(requestId);
    return NextResponse.json({ ...forecast, requestId });
  } catch (err) {
    console.error(`[getDailyForecast] ❌ Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch daily forecast' }, { status: 500 });
  }
}
