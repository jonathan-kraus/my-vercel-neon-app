import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';
import { logEvent } from '../lib/log';

const requestId = crypto.randomUUID();
      await logEvent({
        source: 'getDailyForecast',
        message: `Route accessed`,
        requestId,
        metadata: { userAction: 'receive' },
      });
export async function GET() {
  const requestId = crypto.randomUUID();
  console.log(`[getDailyForecast] API route started at ${new Date().toISOString()}`);

  try {
    const forecast = await getDailyForecast(requestId);
    return NextResponse.json({ forecast, requestId });
  } catch (err) {
    console.error(`[getDailyForecast] ❌ Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch daily forecast' }, { status: 500 });
  }
}