import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/slow-query-history/route.ts', requestId);

  try {
    // Get the most recent slow query history records
    const history = await db.slowQueryHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    await log.info('Fetched slow query history', {
      count: history.length,
      sources: history.map((h) => h.source),
    });

    return NextResponse.json({
      count: history.length,
      history,
      uniqueQueries: history.map((h) => h.queryHash).filter((v, i, a) => a.indexOf(v) === i).length,
    });
  } catch (error) {
    try {
      await log.error('Failed to fetch slow query history', { error: String(error) });
    } catch (logErr) {
      console.warn('Failed to log error', logErr);
    }
    return NextResponse.json({ error: 'Failed to fetch slow query history' }, { status: 500 });
  }
}
