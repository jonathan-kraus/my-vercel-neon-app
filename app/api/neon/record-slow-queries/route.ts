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
 * Can be triggered manually or  via cron:
 * POST /api/neon/record-slow-queries
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  // Replace your entire authorization block with this:

  // 1. Get header and secret
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // Check 1: Is the secret missing from the environment? (Severe error)
  if (!cronSecret) {
    console.error('CRON_SECRET is missing from environment variables!');
    return NextResponse.json({ error: 'Server Misconfiguration' }, { status: 500 });
  }

  // Check 2: Define what constitutes a valid request
  const isCronJob = authHeader === `Bearer ${cronSecret}`;
  // 💡 FIX: This allows the internal app call where the header is missing/null
  const isInternalAppCall = !authHeader;

  // 3. Final authorization check
  if (!isCronJob && !isInternalAppCall) {
    // If the request is neither an authorized cron job NOR an internal app call, reject it.
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Authorized slow query recording request');

  // ... rest of your slow query API logic proceeds here ...
  const requestId = generateUUID();
  const log = createLogger('app/api/neon/record-slow-queries/route.ts', requestId);

  try {
    await log.info('Starting periodic slow query recording', {
      source: 'cron-job app/api/neon/record-slow-queries/route.ts',
    });

    // Fetch slow queries from pg_stat_statements
    const rows: Array<{
      query: string;
      calls: number;
      total_exec_time: number;
      mean_exec_time: number;
    }> = await db.$queryRaw`
      SELECT 
        query, 
        calls, 
        total_exec_time::numeric as total_exec_time, 
        mean_exec_time::numeric as mean_exec_time
      FROM pg_stat_statements
      ORDER BY mean_exec_time DESC
      LIMIT 50;
    `;

    await log.info('Fetched queries from pg_stat_statements', {
      count: rows.length,
    });

    if (rows.length === 0) {
      await log.error('No queries found', { requestId });
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
            meanTime: row.mean_exec_time,
            // 🛠️ FIX: Convert the BigInt (1n, 94n) received from the DB
            // to a standard JavaScript Number, which Prisma expects for the Int field.
            calls: Number(String(row.calls)),
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
        source: 'cron-job app/api/neon/record-slow-queries/route.ts',
        count: successes,
      });
    }

    return NextResponse.json({
      success: true,
      recorded: successes,
      failed: failures.length,
      total: rows.length,
      mySlowCount: await db.slowQueryHistory.count(),
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
