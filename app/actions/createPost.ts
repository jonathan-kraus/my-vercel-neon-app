'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../lib/db';
import { logger } from '../lib/logger';
import { triggerEmail } from '../components/actions';

export async function createPost(formData: FormData) {
  const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

  try {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    const authorName = formData.get('authorName') as string;

    if (!title || !content || !authorName) {
      throw new Error('Title, content, and author name are required');
    }

    // Ensure user exists
    let user = await db.user.findFirst({ where: { name: authorName } });
    if (!user) {
      user = await db.user.create({
        data: { name: authorName, email: `${authorName}@example.local` },
      });
    }

    const post = await db.post.create({
      data: {
        title,
        content,
        published: true,
        author: { connect: { id: user.id } },
      },
    });

    // Send email notification for new post (bypasses throttle)
    try {
      await triggerEmail(
        'New Post Created',
        requestId,
        `Post: ${post.title}`,
        `Created by ${authorName}\n\n${post.content}`
      );
    } catch (emailErr) {
      console.error('Failed to send post creation email:', emailErr);
      // non-fatal
    }

    try {
      await logger({
        severity: 'info',
        source: 'CreatePost Action',
        message: `Post created by ${authorName}: ${requestId}`,
        requestId,
        metadata: { userAction: 'create_post', postTitle: post.title },
      });
    } catch {
      // non-fatal
    }

    revalidatePath('/');
    redirect('/?posted=1');
  } catch (err) {
    console.error('CreatePost action error:', err);
    redirect('/?error=1');
  }
}
