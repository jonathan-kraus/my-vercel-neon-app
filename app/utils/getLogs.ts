'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getLogsByAuthor() {
  const logs = await prisma.post.findMany({
    where: { authorId: 1101 },
    orderBy: { createdAt: 'desc' }, // optional: newest first
  });

  return logs;
}
