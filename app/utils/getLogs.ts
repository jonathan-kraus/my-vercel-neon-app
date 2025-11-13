import { db } from '../lib/db';
import { createLogger } from './logger';
import { generateUUID } from '@/uuidj';

export async function getLogs(limit = 50) {
  const requestId = generateUUID();
  const log = createLogger('app/utils/getLogs.ts', requestId);

  try {
    const logs = await db.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    await log
      .error('Error fetching logs', {
        error: error instanceof Error ? error.message : String(error),
        limit,
      })
      .catch(() => {
        // Fallback if logging fails
        console.warn('[getLogs] Failed to log error:', error);
      });
    return [];
  }
}
