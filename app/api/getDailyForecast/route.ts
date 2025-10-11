import { NextResponse } from 'next/server';
//import { getDailyForecast } from '@/app/lib/GetDailyForecast';
import { db } from '@/app/lib/db';

export async function GET() {
  const requestId = crypto.randomUUID();
  console.log(`[getDailyForecast] API route started at ${new Date().toISOString()}`);

  async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, delay = 1000): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      console.warn(`Attempt ${attempt + 1} failed: ${res.status}`);
    } catch (err) {
      console.error(`Attempt ${attempt + 1} threw:`, err);
      await db.log.create({
  data: {
    severity: 'warn',
    source: 'getDailyForecast',
    message: `Retry attempt ${attempt + 1} failed`,
    requestId,
    metadata: { status: err instanceof Error ? err.message : String(err) },

  },
});

    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
}


  try {
    const forecast = await fetchWithRetry('/api/getDailyForecast');
    const data = await forecast.json();
    console.log(`[getDailyForecast] Forecast fetched successfully:`, data);
    return NextResponse.json({ forecast, requestId });
  } catch (err) {
    console.error(`[getDailyForecast] ❌ Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch daily forecast' }, { status: 500 });
  }
}
