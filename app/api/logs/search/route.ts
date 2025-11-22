import { NextResponse } from 'next/server';
import { createLogger } from '@/app/utils/logger';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { isFeatureEnabled } from '@/app/utils/featureFlags';

export async function GET(req: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/logs/search/route', requestId);
  if (await isFeatureEnabled('VERBOSE_LOGGING')) {
    log.info(`[app/api/logs/search/route] Initialized log search route`, {
      action: `init`,
      request: {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(req.headers.entries()),
      },
      timestamp: new Date().toISOString(),
    });
  }
  try {
    const url = new URL(req.url);
    const params = url.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(params.get('pageSize') || '25', 10)));
    const severity = params.get('severity') || undefined;
    const source = params.get('source') || undefined;
    const message = params.get('message') || undefined;
    const requestIdParam = params.get('requestId') || undefined;
    const metadata = params.get('metadata') || undefined;
    const from = params.get('from') || undefined;
    const to = params.get('to') || undefined;
    const where: any = {};
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (message) where.message = { contains: message, mode: 'insensitive' };
    if (requestIdParam) where.requestId = { equals: requestIdParam };
    if (from || to) {
      where.timestamp = {};
      if (from) {
        const d = new Date(from);
        if (!isNaN(d.getTime())) where.timestamp.gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!isNaN(d.getTime())) where.timestamp.lte = d;
      }
    }

    const skip = (page - 1) * pageSize;

    let items, total;

    if (metadata) {
      // Build SQL query with proper parameter handling
      let query = 'SELECT * FROM "Log" WHERE metadata::text ILIKE $1';
      let countQuery = 'SELECT COUNT(*)::int as count FROM "Log" WHERE metadata::text ILIKE $1';
      const queryParams: any[] = [`%${metadata}%`];
      let paramIndex = 2;

      if (severity) {
        query += ` AND severity = $${paramIndex}`;
        countQuery += ` AND severity = $${paramIndex}`;
        queryParams.push(severity);
        paramIndex++;
      }
      if (source) {
        query += ` AND source = $${paramIndex}`;
        countQuery += ` AND source = $${paramIndex}`;
        queryParams.push(source);
        paramIndex++;
      }
      if (message) {
        query += ` AND message ILIKE $${paramIndex}`;
        countQuery += ` AND message ILIKE $${paramIndex}`;
        queryParams.push(`%${message}%`);
        paramIndex++;
      }
      if (requestIdParam) {
        query += ` AND "requestId" = $${paramIndex}`;
        countQuery += ` AND "requestId" = $${paramIndex}`;
        queryParams.push(requestIdParam);
        paramIndex++;
      }
      if (from) {
        query += ` AND timestamp >= $${paramIndex}::timestamp`;
        countQuery += ` AND timestamp >= $${paramIndex}::timestamp`;
        queryParams.push(new Date(from).toISOString());
        paramIndex++;
      }
      if (to) {
        query += ` AND timestamp <= $${paramIndex}::timestamp`;
        countQuery += ` AND timestamp <= $${paramIndex}::timestamp`;
        queryParams.push(new Date(to).toISOString());
        paramIndex++;
      }

      query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(pageSize, skip);

      items = await db.$queryRawUnsafe<any[]>(query, ...queryParams);
      const [countResult] = await db.$queryRawUnsafe<[{ count: bigint }]>(
        countQuery,
        ...queryParams.slice(0, paramIndex - 1)
      );
      total = Number(countResult.count);
      log.info(`[app/api/logs/search/route] Executed raw SQL log search`, {
        action: `raw_sql_search`,
        query,
        queryParams,
        totalItems: total,
        requestId: req.headers.get('x-request-id') ?? generateUUID(),
        countQuery: countQuery,
        timestamp: new Date().toISOString(),
      });
    } else {
      [items, total] = await Promise.all([
        db.log.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip,
          take: pageSize,
        }),
        db.log.count({ where }),
      ]);
    }
    if (await isFeatureEnabled('VERBOSE_LOGGING')) {
      log.info(`[app/api/logs/search/route] Retrieved log search results ${total}`, {
        action: `fetch_logs`,
        itemsFetched: items.length,
        page,
        timestamp: new Date().toISOString(),
        totalItems: total,
      });
    }
    return NextResponse.json({ items, total, page, pageSize });
  } catch (err) {
    await log.error('Error in log search', { error: String(err) });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
