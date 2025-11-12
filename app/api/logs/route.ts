import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET() {
  const requestId = generateUUID();
  const log = createLogger('app/api/logs/route.ts', requestId);

  try {
    const logs = await db.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50, // adjust as needed
    });

    return NextResponse.json(logs);
  } catch (error) {
    await log.error('Failed to fetch logs', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
