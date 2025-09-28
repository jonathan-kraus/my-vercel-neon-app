'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDbStatus() {
  const [version, postCount, logCount, latestPost] = await Promise.all([
    prisma.$queryRaw`SELECT version()`,
    prisma.post.count(),
    prisma.log.count(),
    prisma.post.findFirst({ orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    logCount,
    latestPostDate: latestPost?.createdAt || null,
  };
}
