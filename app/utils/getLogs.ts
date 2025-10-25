'use server';

import { db } from '../lib/db';

export async function getLogs() {
  const logs = await db.log.findMany({
    orderBy: { timestamp: 'desc' }, // optional: newest first
  });

  return logs;
}
