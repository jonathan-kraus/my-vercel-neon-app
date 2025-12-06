// app/api/getDailyForecast/route.ts
import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '../../../uuidj';

export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? generateUUID();
  const log = createLogger('getDailyForecast', requestId);

  await log.info('Fetching daily forecast');

  try {
    const result = await getDailyForecast(requestId);

    await log.info('Forecast fetched successfully', {
      forecastLength: result.forecast.length,
      maxRainAccumulation: result.maxRainAccumulation,
      night: 'night',
    });

    return NextResponse.json({ ...result, requestId });
  } catch (err) {
    await log.error('Forecast fetch failed', { error: String(err) });

    return NextResponse.json(
      { error: 'Failed to fetch daily forecast', requestId },
      { status: 500 }
    );
  }
}
