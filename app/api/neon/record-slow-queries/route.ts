import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';
import crypto from 'crypto';

// Helper to normalize and hash queries for grouping
function hashQuery(query: string): string {
  const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * This endpoint is designed to be called by Vercel Cron (or similar)
 * to periodically record slow and frequent queries to SlowQueryHistory.
 *
 * Can be triggered manually or via cron:
 * POST /api/neon/record-slow-queries
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Verify authorization
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requestId = generateUUID();
  const log = createLogger('app/api/neon/record-slow-queries/route.ts', requestId);

  try {
    await log.info('Starting periodic slow query recording', { requestId });

    // Fetch slow queries from pg_stat_statements
    const rows: Array<{
      query: string;
      calls: number;
      total_exec_time: number;
      mean_exec_time: number;
    }> = await db.$queryRaw`
      SELECT query, calls, total_exec_time, mean_exec_time
      FROM pg_stat_statements
      ORDER BY mean_exec_time DESC
      LIMIT 50;
    `;

    await log.info('Fetched queries from pg_stat_statements', {
      count: rows.length,
    });

    if (rows.length === 0) {
      await log.info('No queries found', { requestId });
      return NextResponse.json({
        success: true,
        recorded: 0,
        message: 'No queries to record',
      });
    }

    // Store each query in history - use upsert to avoid duplicates
    const historyPromises = rows.map((row) =>
      db.slowQueryHistory
        .create({
          data: {
            queryHash: hashQuery(row.query),
            query: row.query.substring(0, 4000), // Ensure query isn't too long
            meanTime: Number(row.mean_exec_time) || 0,
            calls: typeof row.calls === 'bigint' ? Number(row.calls) : row.calls || 0,
            source: 'pg_stat_statements',
            requestId,
          },
        })
        .catch((err) => {
          console.error('Failed to create record:', {
            hash: hashQuery(row.query),
            error: String(err),
          });
          throw err;
        })
    );

    const historyResults = await Promise.allSettled(historyPromises);
    const successes = historyResults.filter((r) => r.status === 'fulfilled').length;
    const failures = historyResults.filter((r) => r.status === 'rejected');

    if (failures.length > 0) {
      const errorMessages = failures
        .map((f) => (f.status === 'rejected' ? String(f.reason) : 'Unknown'))
        .slice(0, 3); // Log first 3 errors
      await log.warn('Some slow query history writes failed', {
        total: rows.length,
        successes,
        failures: failures.length,
        sampleErrors: errorMessages,
      });
    } else {
      await log.info('All slow query history records recorded', {
        count: successes,
      });
    }

    return NextResponse.json({
      success: true,
      recorded: successes,
      failed: failures.length,
      total: rows.length,
    });
  } catch (error) {
    try {
      await log.error('Failed to record slow queries', { error: String(error) });
    } catch (logErr) {
      console.warn('Failed to log error', logErr);
    }
    return NextResponse.json(
      { error: 'Failed to record slow queries', details: String(error) },
      { status: 500 }
    );
  }
}
