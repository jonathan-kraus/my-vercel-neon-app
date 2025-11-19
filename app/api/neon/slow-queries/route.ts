import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/slow-queries/route.ts', requestId);

  try {
    // Try to use pg_stat_statements if available
    try {
      const rows: Array<{ query: string; calls: number; total_time: number; mean_time: number }> =
        await db.$queryRaw`
        SELECT query, calls, total_time, mean_time
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT 5;
      `;

      await log.info('Fetched slow queries from pg_stat_statements', { count: rows.length });
      return NextResponse.json({ source: 'pg_stat_statements', queries: rows });
    } catch (err) {
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
      return NextResponse.json({ source: 'pg_stat_activity', queries: rows });
    }
  } catch (error) {
    try {
      await log.error('Failed to fetch slow queries', { error: String(error) });
    } catch {}
    return NextResponse.json({ error: 'Failed to fetch slow queries' }, { status: 500 });
  }
}
