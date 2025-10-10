import { NextRequest } from 'next/server';
import { db } from '@/app/lib/db';

export async function POST(req: NextRequest) {
  const formData = await req.formData();

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

  return Response.redirect('/pstbyusr', 302);
}
