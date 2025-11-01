'use server';

import { db } from '@/app/lib/db';
import { logEvent } from '../lib/abslog';

const prisma = db; // For clarity in this file
const requestId = crypto.randomUUID();
export async function getDbStatus() {
  console.log(`[getDbStatus] [${requestId}] Checking database status...`);

  const start = Date.now();
  const [version, postCount, latestPost, logCount] = await Promise.all([
    prisma.$queryRaw`SELECT version()`,
    prisma.post.count({ where: { authorId: { not: 1101 } } }),
    prisma.post.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.log.count(),
  ]);
  const latencyMs = Date.now() - start;
  console.log(`[getDbStatus] [${requestId}] Start logging database status...`);
  const message = `Database Version: ${(version as { version: string }[])[0].version}
Total Posts (excluding authorId 1101): ${postCount}
Latest Post Date: ${latestPost?.createdAt || 'N/A'}
Log Entries Count: ${logCount} 
Latency: ${latencyMs} ms`;
  await logEvent({
    source: 'getDbStatus',
    message: 'Database status retrieved',
    requestId,
    metadata: { userAction: 'fetch' },
  });
  //await triggerEmail('JDB Status', requestId, `Database Status Update`, message);

  console.log(`[getDbStatus] [${requestId}] Database status logged.`);
  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    latestPostDate: latestPost?.createdAt || null,
    logCount,
    latencyMs,
  };
}
