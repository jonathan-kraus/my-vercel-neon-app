import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';
const requestId = crypto.randomUUID();

import { logEvent } from '@/app/lib/log';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const author = searchParams.get('author');

    const posts = await db.post.findMany({
      where: {
        published: true,            // Filter to only published posts
        ...(author
          ? {
              author: {
                name: {
                  contains: author,
                  mode: 'insensitive',
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });
await logEvent({
  source: 'Posts API',
  message: `Posts API accessed: ${requestId}`,
  requestId,
  metadata: { userAction: 'fetch' },
});
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
