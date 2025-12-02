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
export function generateId(): string {
  const prefix = 'JK';
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < 14; i++) {
    out += charset[crypto.randomInt(0, charset.length)];
  }
  return prefix + out;
}
export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/slow-queries/route.ts', requestId);

  try {
    // First, fetch currently executing queries with their parameter values from pg_stat_activity
    let currentQueries: Array<{ query: string; pid: number }> = [];
    try {
      currentQueries = await db.$queryRaw`
        SELECT query, pid
        FROM pg_stat_activity
        WHERE state = 'active' AND query <> '<insufficient privilege>'
        LIMIT 20;
      `;
    } catch (err) {
      console.warn('Failed to fetch current queries from pg_stat_activity', err);
    }

    // Try to use pg_stat_statements if available
    try {
      // Get all queries sorted by multiple criteria (slow + frequent)
      const allRows: Array<{
        query: string;
        calls: number;
        total_exec_time: number;
        mean_exec_time: number;
      }> = await db.$queryRaw`
        SELECT query, calls, total_exec_time, mean_exec_time
        FROM pg_stat_statements
        ORDER BY 
          CASE 
            WHEN mean_exec_time > 100 THEN 1  -- Prioritize slow queries (>100ms)
            WHEN calls > 20 THEN 2              -- Then frequent queries (>20 calls)
            ELSE 3
          END,
          mean_exec_time DESC,
          calls DESC
        LIMIT 10;
      `;

      const rows = allRows;

      await log.info('Fetched queries from pg_stat_statements', {
        count: rows.length,
      });

      // For each slow query, try to find a matching query with actual values in pg_stat_activity
      const enrichedRows = rows.map((row) => {
        const template = row.query.toLowerCase().replace(/\$\d+/g, '?');
        const matchingCurrent = currentQueries.find(
          (cq) => cq.query.toLowerCase().replace(/\$\d+/g, '?') === template
        );
        return {
          ...row,
          // If we found a matching query with actual values, use that for explain
          explainQuery: matchingCurrent?.query || row.query,
        };
      });

      // Store each query in history
      const historyPromises = enrichedRows.map((row) =>
        db.slowQueryHistory.create({
          data: {
            //queryHash: hashQuery(row.query),
            queryHash: generateId(),
            query: row.query,
            meanTime: row.mean_exec_time,
            calls: row.calls,
            source: 'pg_stat_statements',
            requestId,
          },
        })
      );
      const historyResults = await Promise.allSettled(historyPromises);
      const historySuccesses = historyResults.filter((r) => r.status === 'fulfilled').length;
      const historyFailures = historyResults.filter((r) => r.status === 'rejected');

      if (historyFailures.length > 0) {
        await log.warn('Some slow query history writes failed', {
          failures: historyFailures.length,
          errors: historyFailures.map((f) => (f.status === 'rejected' ? String(f.reason) : '')),
        });
      } else {
        await log.info('All slow query history records written', { count: historySuccesses });
      }

      const safeRows = enrichedRows.map((row) => ({
        ...row,
        calls: typeof row.calls === 'bigint' ? Number(row.calls) : row.calls,
        total_exec_time:
          typeof row.total_exec_time === 'bigint'
            ? Number(row.total_exec_time)
            : row.total_exec_time,
        mean_exec_time:
          typeof row.mean_exec_time === 'bigint' ? Number(row.mean_exec_time) : row.mean_exec_time,
        // Ensure explainQuery is preserved
        explainQuery: row.explainQuery,
      }));
      return NextResponse.json({ source: 'pg_stat_statements', queries: safeRows });
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
            //queryHash: hashQuery(row.query),
            queryHash: generateId(),
            query: row.query,
            durationMs: row.duration_ms,
            source: 'pg_stat_activity',
            requestId,
          },
        })
      );
      const historyResults = await Promise.allSettled(historyPromises);
      const historySuccesses = historyResults.filter((r) => r.status === 'fulfilled').length;
      const historyFailures = historyResults.filter((r) => r.status === 'rejected');

      if (historyFailures.length > 0) {
        await log.warn('Some fallback slow query history writes failed', {
          failures: historyFailures.length,
          errors: historyFailures.map((f) => (f.status === 'rejected' ? String(f.reason) : '')),
        });
      } else {
        await log.info('All fallback slow query history records written', {
          count: historySuccesses,
        });
      }

      // Add explainQuery field to fallback queries (they're already from active queries, so no params)
      const fallbackWithExplain = rows.map((row) => ({
        ...row,
        explainQuery: row.query,
      }));

      return NextResponse.json({ source: 'pg_stat_activity', queries: fallbackWithExplain });
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
