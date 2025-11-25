'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '../lib/db';
import { createLogger } from '../utils/logger';
import { triggerEmail } from '../components/actions';

export async function createPost(formData: FormData) {
  const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const log = createLogger('app/actions/createPost.ts', requestId);

  try {
    const title =
      typeof formData.get('title') === 'string' ? (formData.get('title') as string) : '';
    const content =
      typeof formData.get('content') === 'string' ? (formData.get('content') as string) : '';
    const authorName =
      typeof formData.get('authorName') === 'string' ? (formData.get('authorName') as string) : '';
    const followUpDate =
      typeof formData.get('followUpDate') === 'string'
        ? (formData.get('followUpDate') as string)
        : undefined;
    const followUpNotes =
      typeof formData.get('followUpNotes') === 'string'
        ? (formData.get('followUpNotes') as string)
        : undefined;

    // Zod schema for validation
    const PostFormSchema = require('zod').z.object({
      title: require('zod').z.string().min(1, 'Title is required'),
      content: require('zod').z.string().min(1, 'Content is required'),
      authorName: require('zod').z.string().min(1, 'Author name is required'),
      followUpDate: require('zod').z.string().min(1).optional(),
      followUpNotes: require('zod').z.string().min(1).optional(),
    });

    let parsed;
    try {
      parsed = PostFormSchema.safeParse({
        title,
        content,
        authorName,
        followUpDate,
        followUpNotes,
      });
    } catch (zodErr) {
      await log.error('Zod validation threw: ' + String(zodErr));
      redirect('/?error=validation');
      return;
    }
    if (!parsed.success) {
      await log.error('Post form validation failed: ' + JSON.stringify(parsed.error.format()));
      redirect('/?error=validation');
      return;
    }
    const {
      title: validTitle,
      content: validContent,
      authorName: validAuthorName,
      followUpDate: validFollowUpDate,
      followUpNotes: validFollowUpNotes,
    } = parsed.data;

    // Ensure user exists
    let user = await db.user.findFirst({ where: { name: validAuthorName } });
    if (!user) {
      user = await db.user.create({
        data: { name: validAuthorName, email: `${validAuthorName}@example.local` },
      });
    }

    const postData: any = {
      title: validTitle,
      content: validContent,
      published: true,
      needsFollowUp: !!validFollowUpDate || !!validFollowUpNotes, // Set needsFollowUp if any follow-up fields are provided
      author: { connect: { id: user.id } },
    };

    if (validFollowUpDate) {
      postData.followUpDate = new Date(validFollowUpDate);
    }

    if (validFollowUpNotes) {
      postData.followUpNotes = validFollowUpNotes;
    }

    const post = await db.post.create({
      data: postData,
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
      await log.info(`[createPost] Post created by ${authorName}`, {
        userAction: 'create_post',
        postTitle: post.title,
      });
      await log.info('[createPost]Email sent to admin about new post', {
        userAction: 'send_email',
        postTitle: post.title,
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
