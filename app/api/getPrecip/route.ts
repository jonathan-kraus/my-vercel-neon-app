import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { createLogger } from '@/app/utils/logger';

export async function GET() {
  const log = createLogger('app/api/getPrecip/route.ts');
  try {
    const precip = await db.weatherCache.findFirst({
      where: { location: 'kop' },
      orderBy: { updatedAt: 'desc' },
      select: { rainAccumulationSum: true },
    });
    log.info('Precipitation data retrieved', { location: 'kop', precip });
    return NextResponse.json({ precip });
  } catch (error) {
    log.error('Failed to fetch precipitation', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch precipitation' }, { status: 500 });
  }
}
