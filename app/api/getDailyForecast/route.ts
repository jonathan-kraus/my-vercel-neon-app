// app/api/getDailyForecast/route.ts
import { NextResponse } from 'next/server';
import { getDailyForecast } from '@/app/lib/GetDailyForecast';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '../../../uuidj';
import { asyncLocalStorage } from '@/app/utils/requestContext';

export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? generateUUID();
  return asyncLocalStorage.run({ requestId }, async () => {
    const log = createLogger('getDailyForecast');
    await log.info('Fetching daily forecast');
    try {
      const result = await getDailyForecast();
      await log.info('Forecast fetched successfully', {
        forecastLength: result.forecast.length,
        maxRainAccumulation: result.maxRainAccumulation,
      });
      return NextResponse.json({ ...result, requestId });
    } catch (err) {
      await log.error('Forecast fetch failed', { error: String(err) });
      return NextResponse.json(
        { error: 'Failed to fetch daily forecast', requestId },
        { status: 500 }
      );
    }
  });
}
