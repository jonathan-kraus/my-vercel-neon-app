'use server';

import { db } from '@/app/lib/db';
import { cookies } from 'next/headers';

export async function deletePost(postId: number) {
  const cookieStore = cookies();
  const user = cookieStore.get('authorizedUser')?.value;

  if (!user) {
    throw new Error('Unauthorized');
  }

const post = await db.post.findUnique({
  where: { id: postId },
  include: { author: true },
});

if (post?.author?.name !== user) {
  throw new Error('Forbidden');
}


  await db.post.delete({ where: { id: postId } });
}
