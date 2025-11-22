import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';
import crypto from 'crypto';

// Helper to normalize and hash queries for grouping
function hashQuery(query: string): string {
  // Normalize: remove extra whitespace, lowercase
  const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/slow-queries/route.ts', requestId);

  try {
    // Try to use pg_stat_statements if available
    try {
      const rows: Array<{
        query: string;
        calls: number;
        total_exec_time: number;
        mean_exec_time: number;
      }> = await db.$queryRaw`
        SELECT query, calls, total_exec_time, mean_exec_time
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT 5;
      `;

      await log.info('Fetched slow queries from pg_stat_statements', {
        count: rows.length,
        mean: rows.reduce((acc, row) => acc + row.mean_exec_time, 0) / rows.length,
      });

      // Store each query in history
      const historyPromises = rows.map((row) =>
        db.slowQueryHistory.create({
          data: {
            queryHash: hashQuery(row.query),
            query: row.query,
            meanTime: row.mean_exec_time,
            calls: row.calls,
            source: 'pg_stat_statements',
            requestId,
          },
        })
      );
      await Promise.allSettled(historyPromises);

      return NextResponse.json({ source: 'pg_stat_statements', queries: rows });
    } catch (err) {
      // If pg_stat_statements is not available or fails, log and fallback to pg_stat_activity
      try {
        await log.warn('pg_stat_statements not available', { error: String(err) });
      } catch (logErr) {
        console.warn('Failed to log pg_stat_statements error', logErr);
      }
      // Fallback to pg_stat_activity to show long running queries
      const rows: Array<{ pid: number; duration_ms: number; state: string; query: string }> =
        await db.$queryRaw`
        SELECT pid, EXTRACT(EPOCH FROM (now() - query_start)) * 1000 AS duration_ms, state, query
        FROM pg_stat_activity
        WHERE state <> 'idle' AND query <> '<insufficient privilege>'
        ORDER BY duration_ms DESC
        LIMIT 5;
      `;
      await log.info('Fetched slow queries from pg_stat_activity (fallback)', {
        count: rows.length,
      });

      // Store fallback queries in history
      const historyPromises = rows.map((row) =>
        db.slowQueryHistory.create({
          data: {
            queryHash: hashQuery(row.query),
            query: row.query,
            durationMs: row.duration_ms,
            source: 'pg_stat_activity',
            requestId,
          },
        })
      );
      await Promise.allSettled(historyPromises);

      return NextResponse.json({ source: 'pg_stat_activity', queries: rows });
    }
  } catch (error) {
    try {
      await log.error('Failed to fetch slow queries', { error: String(error) });
    } catch (logErr) {
      console.warn('Failed to log slow queries error', logErr);
    }
    return NextResponse.json({ error: 'Failed to fetch slow queries' }, { status: 500 });
  }
}
