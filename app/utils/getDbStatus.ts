'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getDbStatus() {
  const [version, postCount, latestPost, logCount] = await Promise.all([
    prisma.$queryRaw`SELECT version()`,
    prisma.post.count(),
    prisma.post.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.post.count({ where: { published: false } }), // Uncomment if you want to include log count
    
  ]);

  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    latestPostDate: latestPost?.createdAt || null,
    logCount, // Uncomment if you want to include log count
    
  };
}
const 
