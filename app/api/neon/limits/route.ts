import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/limits/route.ts', requestId);

  try {
    // Get max connections
    const maxRes: Array<{ setting: string } & Record<string, any>> = await db.$queryRaw`
      SELECT name, setting FROM pg_settings WHERE name = 'max_connections';
    `;

    const maxConnections = maxRes && maxRes[0] ? parseInt(maxRes[0].setting, 10) : null;

    // Get active and total connections
    const connRes: Array<{ active: number; total: number }> = await db.$queryRaw`
      SELECT
        count(*) FILTER (WHERE state = 'active') AS active,
        count(*) AS total
      FROM pg_stat_activity;
    `;

    const activeConnections = connRes && connRes[0] ? Number(connRes[0].active) : 0;
    const totalConnections = connRes && connRes[0] ? Number(connRes[0].total) : 0;

    const utilization = maxConnections
      ? Math.round((activeConnections / maxConnections) * 100)
      : null;

    await log.info('Neon limits fetched', { maxConnections, activeConnections, totalConnections });

    return NextResponse.json({ maxConnections, activeConnections, totalConnections, utilization });
  } catch (error) {
    try {
      await log.error('Failed to fetch neon limits', { error: String(error) });
    } catch (logErr) {
      console.warn('Failed to log neon limits error', logErr);
    }
    return NextResponse.json({ error: 'Failed to fetch neon limits' }, { status: 500 });
  }
}
