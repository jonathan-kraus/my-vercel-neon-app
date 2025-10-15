// app/actions/createPost.ts
'use server';

import { db } from '@/app/lib/db';
import { redirect } from 'next/navigation';

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
    await db.log.create({
      data: {
        severity,
        source,
        message,
        requestId,
        metadata: metadata ?? {},
        timestamp: new Date(),
      },
    })
  redirect('/'); // ✅ Send them back to the homepage
}
