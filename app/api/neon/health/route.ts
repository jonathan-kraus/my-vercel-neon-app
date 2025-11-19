import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/health/route.ts', requestId);

  try {
    const start = Date.now();
    // Simple lightweight check
    await db.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    await log.info('Neon health check OK', { latencyMs });

    return NextResponse.json({ ok: true, latencyMs });
  } catch (error) {
    try {
      await log.error('Neon health check failed', { error: String(error) });
    } catch {}
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
