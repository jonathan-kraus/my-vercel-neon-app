'use server';

import { PrismaClient } from '@prisma/client';
import { createLog } from './db';
let start: number;
let latencyMs: number;
const prisma = new PrismaClient();

export async function getDbStatus() {
  createLog({authorId: 1101,title: 'getDbStatus',content: `getDbStatus called`});
  const [version, postCount, latestPost, logCount] = await Promise.all([
    prisma.$queryRaw`SELECT version()`,
    prisma.post.count({ where: { authorId: { not: 1101 } } }),
    prisma.post.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.post.count({ where: { authorId: 1101 } }), // Uncomment if you want to include log count
    start = Date.now(),
    prisma.$queryRaw`SELECT 1`,
    latencyMs = Date.now() - start 

  ]);
  createLog({authorId: 1101,title: 'getDbStatus',content: `getDbStatus completed`});

  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    latestPostDate: latestPost?.createdAt || null,
    logCount, // Uncomment if you want to include log count
    latencyMs
  };
}
