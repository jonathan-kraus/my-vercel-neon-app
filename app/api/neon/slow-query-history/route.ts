import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/slow-query-history/route.ts', requestId);

  try {
    // Calculate the cutoff time: 24 hours ago
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get slow query history from the last 24 hours
    const history = await db.slowQueryHistory.findMany({
      where: {
        timestamp: {
          gte: cutoffTime,
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    await log.info('Fetched slow query history (24h)', {
      count: history.length,
      cutoffTime: cutoffTime.toISOString(),
    });

    // Clean up records older than 7 days (optional, but helps manage database size)
    const cleanupCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
      const deleted = await db.slowQueryHistory.deleteMany({
        where: {
          timestamp: {
            lt: cleanupCutoff,
          },
        },
      });
      if (deleted.count > 0) {
        await log.info('Cleaned up old slow query history records', {
          deletedCount: deleted.count,
          olderThan: cleanupCutoff.toISOString(),
        });
      }
    } catch (cleanupErr) {
      await log.warn('Failed to clean up old history records', {
        error: String(cleanupErr),
      });
    }

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
