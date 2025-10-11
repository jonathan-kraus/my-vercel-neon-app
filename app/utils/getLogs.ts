'use server';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getLogsByAuthor() {
  const logs = await prisma.log.findMany({

    orderBy: { timestamp: 'desc' }, // optional: newest first
  });

  return logs;
}
