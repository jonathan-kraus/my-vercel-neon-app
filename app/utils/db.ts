// utils/db.js
import { PrismaClient } from '@prisma/client';
import { createLogger } from './logger';
import { randomUUID } from 'crypto';

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
  const requestId = randomUUID();
  const log = createLogger('createLog', requestId);

  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId,
      published: false,
    },
  });

  await log
    .info('Post created', {
      title,
      authorId,
      postId: post.id,
    })
    .catch(() => console.warn('[createLog] Failed to log post creation'));

  return post;
}
