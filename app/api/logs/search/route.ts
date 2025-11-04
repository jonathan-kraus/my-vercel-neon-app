import { NextResponse } from 'next/server';
import { logInfoFactory } from '@/app/utils/logger';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
const logInfo = logInfoFactory('app/api/logs/search/route');

(logInfo('Initialized log search route'),
  { action: 'init', timestamp: new Date().toISOString() },
  generateUUID());

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const page = Math.max(1, parseInt(params.get('page') || '1', 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(params.get('pageSize') || '25', 10)));

    const severity = params.get('severity') || undefined;
    const source = params.get('source') || undefined;
    const message = params.get('message') || undefined;
    const requestId = params.get('requestId') || undefined;
    const from = params.get('from') || undefined;
    const to = params.get('to') || undefined;

    const where: any = {};
    if (severity) where.severity = severity;
    if (source) where.source = source;
    if (message) where.message = { contains: message, mode: 'insensitive' };
    if (requestId) where.requestId = { equals: requestId };
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

    const [items, total] = await Promise.all([
      db.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
      }),
      db.log.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, pageSize });
  } catch (err) {
    console.error('Error in /api/logs/search', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
