// app/api/getDailyForecast/route.ts
import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';
import { logger } from '@/app/utils/logger';
import { generateUUID } from '../../../uuidj';

export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? generateUUID();
  const source = 'getDailyForecast';
  console.log('[getDailyForecast] New logger follows', `${requestId}`);
  await logger({
    severity: 'info',
    source,
    message: 'Fetching daily forecast',
    requestId,
  });

  try {
    const result = await getDailyForecast(requestId);

    await logger({
      severity: 'info',
      source,
      message: 'Forecast fetched successfully',
      requestId,
      metadata: {
        forecastLength: result.forecast.length,
        maxRainAccumulation: result.maxRainAccumulation,
      },
    });
    console.log('[getDailyForecast] New logger above', `${requestId}`);
    return NextResponse.json({ ...result, requestId });
  } catch (err) {
    await logger({
      severity: 'error',
      source,
      message: 'Forecast fetch failed',
      requestId,
      metadata: { error: String(err) },
    });

    return NextResponse.json(
      { error: 'Failed to fetch daily forecast', requestId },
      { status: 500 }
    );
  }
}
