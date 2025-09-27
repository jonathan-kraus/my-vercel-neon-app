// utils/db.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function createLog({
  title,
  content,
  authorId,
}: {
  title: string;
  content: string;
  authorId: number;
}): Promise<{
  title: string;
  content: string;
  authorId: number;
  published: boolean;
  id: number;
}> {
  const log = await prisma.post.create({
    data: {
      title,
      content,
      authorId,
      published: false,
    },
  });

  return log;
}
