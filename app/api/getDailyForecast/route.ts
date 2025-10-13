import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';
import { logEvent } from '@/app/lib/log';

export async function GET() {
  const requestId = crypto.randomUUID();

  console.log(`[getDailyForecast] [${requestId}] API route started at ${new Date().toISOString()}`);
console.log(`[getDailyForecast] 🧭 TRACE: ${requestId}`);

try {
  await logEvent({
    source: 'getDailyForecast',
    message: `Route accessed`,
    requestId,
    metadata: { userAction: 'receive' },
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
