import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';
//import { logEvent } from '@/app/lib/log';
console.log('[build] Generating /getDailyForecast');
export async function GET() {
  const requestId = crypto.randomUUID();

  console.log(`[getDailyForecast] [${requestId}] API route started at ${new Date().toISOString()}`);
  console.log(`[getDailyForecast] 🧭 TRACE: ${requestId}`);
  const severity = 'info';
  const source = 'getDailyForecast';
  const message = 'Fetching daily forecast';
  const metadata = { action: 'fetch', timestamp: new Date().toISOString() };
  const baseUrl =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://www.kraus.my.id';
  try {
    await fetch(`${baseUrl}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ severity, source, message, requestId, metadata }),
    });
  } catch (err) {
    console.error(`[getDailyForecast] ❌ logEvent failed:`, err);
  }

  try {
    const forecast = await getDailyForecast(requestId);
    return NextResponse.json({ forecast, requestId });
  } catch (err) {
    console.error(`[getDailyForecast] ❌ Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch daily forecast' }, { status: 500 });
  }
}
