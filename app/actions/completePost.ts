'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { db } from '../lib/db';
import { createLogger } from '../utils/logger';

type CompletePostResult = { success: true } | { success: false; error: string };

export async function completePost(formData: FormData): Promise<CompletePostResult> {
  const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const log = createLogger('app/actions/completePost');

  // Check for authenticated user
  const cookieStore = await cookies();
  const username = cookieStore.get('username')?.value;

  if (!username) {
    await log.warn('Complete post rejected - unauthorized', { requestId });
    return { success: false, error: 'Unauthorized - please sign in' };
  }

  try {
    const postId = formData.get('postId') as string;
    const id = Number(postId);

    if (!id || Number.isNaN(id)) {
      return { success: false, error: 'Invalid post ID' };
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

    return { success: true };
  } catch (err) {
    await log.error('CompletePost action error', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to complete follow-up',
    };
  }
}
