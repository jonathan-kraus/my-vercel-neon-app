'use server';


import { db } from '@/app/lib/db';
let start: number;
let latencyMs: number;
const prisma = db; // For clarity in this file
const requestId = crypto.randomUUID();
export async function getDbStatus() {
  

  const logEvent = async () => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: 'getDbStatus',
          message: 'Retrieving database status',
          requestId: requestId, // or generate dynamically
          metadata: { userAction: 'fetch' },
        }),
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  };

  logEvent();
  const [version, postCount, latestPost, logCount] = await Promise.all([
    prisma.$queryRaw`SELECT version()`,
    prisma.post.count({ where: { authorId: { not: 1101 } } }),
    prisma.post.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.post.count({ where: { authorId: 1101 } }), // Uncomment if you want to include log count
    start = Date.now(),
    prisma.$queryRaw`SELECT 1`,
    latencyMs = Date.now() - start 

  ]);
  

  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    latestPostDate: latestPost?.createdAt || null,
    logCount, // Uncomment if you want to include log count
    latencyMs
  };
}
