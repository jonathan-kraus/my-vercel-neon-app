import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/query-trends/route.ts');

  try {
    const url = new URL(request.url);
    const queryHash = url.searchParams.get('queryHash');
    const hoursBack = parseInt(url.searchParams.get('hours') || '24', 10);

    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    if (queryHash) {
      // Fetch trend for a specific query
      const history = await db.slowQueryHistory.findMany({
        where: {
          queryHash,
          timestamp: { gte: since },
        },
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          meanTime: true,
          durationMs: true,
          calls: true,
          timestamp: true,
          source: true,
        },
      });

      await log.info('Fetched query trend', { queryHash, count: history.length });
      return NextResponse.json({ queryHash, history });
    } else {
      // Fetch aggregated trends for all queries
      const history = await db.slowQueryHistory.findMany({
        where: { timestamp: { gte: since } },
        orderBy: { timestamp: 'desc' },
        take: 100,
        select: {
          id: true,
          queryHash: true,
          query: true,
          meanTime: true,
          durationMs: true,
          calls: true,
          timestamp: true,
          source: true,
        },
      });

      // Group by queryHash and compute stats
      const grouped = history.reduce(
        (acc, row) => {
          if (!acc[row.queryHash]) {
            acc[row.queryHash] = {
              queryHash: row.queryHash,
              query: row.query,
              dataPoints: [],
              avgMeanTime: 0,
              maxMeanTime: 0,
              totalCalls: 0,
            };
          }
          const metric = row.meanTime ?? row.durationMs ?? 0;
          acc[row.queryHash].dataPoints.push({ timestamp: row.timestamp, value: metric });
          acc[row.queryHash].maxMeanTime = Math.max(acc[row.queryHash].maxMeanTime, metric);
          acc[row.queryHash].totalCalls += row.calls ?? 0;
          return acc;
        },
        {} as Record<
          string,
          {
            queryHash: string;
            query: string;
            dataPoints: Array<{ timestamp: Date; value: number }>;
            avgMeanTime: number;
            maxMeanTime: number;
            totalCalls: number;
          }
        >
      );

      // Compute averages
      Object.values(grouped).forEach((g) => {
        const sum = g.dataPoints.reduce((s, p) => s + p.value, 0);
        g.avgMeanTime = g.dataPoints.length > 0 ? sum / g.dataPoints.length : 0;
      });

      await log.info('Fetched aggregated query trends', {
        uniqueQueries: Object.keys(grouped).length,
      });
      return NextResponse.json({ trends: Object.values(grouped) });
    }
  } catch (error) {
    try {
      await log.error('Failed to fetch query trends', { error: String(error) });
    } catch (logErr) {
      console.warn('Failed to log query trends error', logErr);
    }
    return NextResponse.json({ error: 'Failed to fetch query trends' }, { status: 500 });
  }
}
