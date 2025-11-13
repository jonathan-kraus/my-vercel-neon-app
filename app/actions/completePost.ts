'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { db } from '../lib/db';
import { createLogger } from '../utils/logger';

export async function completePost(formData: FormData) {
  const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const log = createLogger('app/actions/completePost', requestId);

  try {
    // Check for authenticated user
    const cookieStore = await cookies();
    const username = cookieStore.get('username')?.value;

    if (!username) {
      await log.warn('Complete post rejected - unauthorized', { requestId });
      throw new Error('Unauthorized - please sign in');
    }

    const postId = formData.get('postId') as string;
    const id = Number(postId);

    if (!id || Number.isNaN(id)) {
      throw new Error('Invalid post ID');
    }

    // Update the post to mark it as completed
    const post = await db.post.update({
      where: { id },
      data: {
        needsFollowUp: false, // Remove from follow-ups
        followUpNotes: `Completed on ${new Date().toLocaleDateString()}`, // Update notes with completion date
      },
    });

    try {
      await log.info('Post follow-up completed', {
        userAction: 'complete_followup',
        user: username,
        postId: post.id.toString(),
        postTitle: post.title,
      });
    } catch {
      // non-fatal
    }

    revalidatePath('/');
    revalidatePath('/follow-ups');
  } catch (err) {
    console.error('CompletePost action error:', err);
    throw err; // Re-throw to let the component handle the error
  }
}
