import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';
import { safeJsonResponse } from '@/app/lib/safeJsonResponse';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/slow-query-history/route.ts', requestId);

  try {
    // Get ALL slow query history records (cleanup handles retention)
    const history = await db.slowQueryHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Increased from 50 to show more historical context
    });

    await log.info('Fetched slow query history (all available)', {
      count: history.length,
    });

    // Get the oldest and newest records for analysis
    const oldestRecord = history.length > 0 ? history[history.length - 1] : null;
    const newestRecord = history.length > 0 ? history[0] : null;
    const dateRange = {
      oldest: oldestRecord?.timestamp.toISOString() || null,
      newest: newestRecord?.timestamp.toISOString() || null,
    };

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

    return safeJsonResponse({
      count: history.length,
      dateRange,
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
