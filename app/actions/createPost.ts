// app/actions/createPost.ts
'use server';

import { db } from '@/app/lib/db';
import { redirect } from 'next/navigation';
import { sendConfirmationEmail } from '@/app/utils/email-client';
import { logger } from '../lib/logger';
console.log('[build] Generating createPost action');
export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const authorName = formData.get('authorName') as string;

  const user = await db.user.findFirst({
    where: { name: { equals: authorName, mode: 'insensitive' } },
  });

  if (!user) throw new Error('User not found');

  await db.post.create({
    data: {
      title,
      content,
      authorId: user.id,
      published: true,
      createdAt: new Date(),
    },
  });
  const severity = 'info';
  const source = 'createPost';
  const message = `Post created successfully: ${content}`;
  const metadata = { action: 'create', timestamp: new Date().toISOString(), authorId: user.id };
  const requestId = crypto.randomUUID();
  console.log(`[createPost] [${requestId}] Post created by ${authorName}`);

  // Send confirmation email to the author
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  await sendConfirmationEmail({
    toEmail: user.email,
    toName: user.name || 'Jonathan',
    requestId,
    message: `Your post titled "${title}" has been successfully created on ${timestamp} by ${user.name}`,
    subject: `📝 New Post Created: "${title}" at ${timestamp}`,
  });
  try {
    await logger({
      severity: 'info',
      source: 'createPost.ts',
      message: `Post created by ${user.name}: ${title}  ${content}`,
      requestId,
      metadata: { userAction: 'create_post', postTitle: title },
    });
  } catch {
    // non-fatal
  }
  await db.log.create({
    data: {
      severity,
      source,
      message,
      requestId,
      metadata: metadata ?? {},
      timestamp: new Date(),
    },
  });
  redirect('/'); // ✅ Send them back to the homepage
}
