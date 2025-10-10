import { NextRequest } from 'next/server';
import { db } from '@/app/lib/db';
import { logEvent } from '../lib/log';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const requestId = crypto.randomUUID();
  const authorId = Number(formData.get('authorId'));
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (isNaN(authorId)) {
    return new Response('Invalid authorId', { status: 400 });
  }

  await db.post.create({
    data: {
      authorId,
      title,
      content,
      published: true,
    },
  });
await logEvent({
  source: 'createNewPost route',
  message: `Post created with title: ${title}`,
  requestId,
  metadata: { userAction: 'create' },
});
  return new Response(null, {
  status: 302,
  headers: { Location: '/pstbyusr' },
});
}
