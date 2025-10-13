'use server';


import { db } from '@/app/lib/db';
import { logEvent } from '../lib/abslog';
let start: number;
let latencyMs: number;
const prisma = db; // For clarity in this file
const requestId = crypto.randomUUID();
export async function getDbStatus() {
  console.log(`[getDbStatus] [${requestId}] Checking database status...`);
 
  const [version, postCount, latestPost, logCount] = await Promise.all([
    prisma.$queryRaw`SELECT version()`,
    prisma.post.count({ where: { authorId: { not: 1101 } } }),
    prisma.post.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.log.count(), // Uncomment if you want to include log count
    start = Date.now(),
    prisma.$queryRaw`SELECT 1`,
    latencyMs = Date.now() - start 

  ]);
  
  await logEvent({
  source: 'getDbStatusJS',
  message: `Retrieving database status postcount ${postCount}`,
  requestId,
  metadata: { userAction: 'fetch' },
});

  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    latestPostDate: latestPost?.createdAt || null,
    logCount, // Uncomment if you want to include log count
    latencyMs
  };
}
