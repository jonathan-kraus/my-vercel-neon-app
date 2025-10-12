'use server';

import { db } from '@/app/lib/db';
import { cookies } from 'next/headers';

export async function deletePost(postId: number) {
  const cookieStore = await cookies();
  const user = cookieStore.get('authorizedUser')?.value;

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    include: { author: true },
  });

  if (!post || post.author.name !== user) {
    return { success: false, error: 'Forbidden' };
  }

  await db.post.delete({ where: { id: postId } });

  return { success: true };
}
