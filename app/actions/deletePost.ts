'use server';

import { db } from '@/app/lib/db';
import { logEvent } from '@/app/lib/log';

const requestId = crypto.randomUUID();

export async function deletePost(formData: FormData) {
  const id = Number(formData.get('id'));
  const session = 1; // mock session
await logEvent({
  source: 'deletePost',
  message: `Post will be deleted with ID: ${id}`,
  requestId,
  metadata: { userAction: 'delete' },
});
  if (!session) throw new Error('Unauthorized');
  if (!id || isNaN(id)) throw new Error('Invalid post ID');

  await db.post.delete({
    where: { id },
  });
  await logEvent({
  source: 'deletePost',
  message: `Post deleted with ID: ${id}`,
  requestId,
  metadata: { userAction: 'delete' },
});
  //toast.success('Post deleted'); // Note: toast won't work in server actions  
}
