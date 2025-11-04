'use server';

import { revalidatePath } from 'next/cache';
import { db } from '../lib/db';
import { logInfoFactory } from '../utils/logger';

const logInfo = logInfoFactory('app/actions/completePost');

export async function completePost(formData: FormData) {
  const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  try {
    const postId = formData.get('postId') as string;
    const id = Number(postId);

    if (!id || Number.isNaN(id)) {
      throw new Error('Invalid post ID');
    }

    // Update the post to mark it as completed
    const post = await db.post.update({
      where: { id },
      data: {
        published: true, // Make it visible on the home page
        needsFollowUp: false, // Remove from follow-ups
        followUpNotes: `Completed on ${new Date().toLocaleDateString()}`, // Update notes with completion date
      },
    });

    try {
      await logInfo(
        `[app/actions/completePost]Post completed: ${requestId}`,
        { userAction: 'complete_post', postId: post.id.toString(), postTitle: post.title },
        requestId
      );
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
