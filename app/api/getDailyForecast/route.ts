import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';
import { logger } from '@/app/lib/logger';
//import { logEvent } from '@/app/lib/log';
console.log('[build] Generating /getDailyForecast');
export async function GET() {
  const requestId = crypto.randomUUID();

  console.log(`[getDailyForecast] [${requestId}] API route started at ${new Date().toISOString()}`);

  const baseUrl =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://www.kraus.my.id';
  try {
    await logger({
      severity: 'info',
      source: 'getDailyForecast/route.ts',
      message: `Fetching daily forecast ${baseUrl}`,
      requestId,
      metadata: { userAction: 'fetch', Component: 'getDailyForecast' },
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
  try {
    const forecast = await getDailyForecast(requestId);
    return NextResponse.json({ forecast, requestId });
  } catch (err) {
    console.error(`[getDailyForecast] ❌ Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch daily forecast' }, { status: 500 });
  }
}
