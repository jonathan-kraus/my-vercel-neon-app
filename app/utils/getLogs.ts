import { db } from '../lib/db';

export async function getLogs(limit = 50) {
  try {
    const logs = await db.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return logs;
  } catch (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
}
