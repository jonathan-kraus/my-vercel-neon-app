'use server';

import { db } from '@/app/lib/db';

export async function deletePost(formData: FormData) {
  const id = Number(formData.get('id'));
  const session = 1; // mock session

  if (!session) throw new Error('Unauthorized');
  if (!id || isNaN(id)) throw new Error('Invalid post ID');

  await db.post.delete({
    where: { id },
  });

  // Optional: redirect after delete
  return { success: true };
}
