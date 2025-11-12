import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '@/uuidj';

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? generateUUID();
  const log = createLogger('app/api/entry/unpublish/route.ts', requestId);
  const cookieStore = await cookies();
  const username = cookieStore.get('username')?.value;

  // Parse request body early to get postId for logging
  let id: string | undefined;
  try {
    const body = await req.json();
    id = body.id;
  } catch (err) {
    await log.warn('Unpublish rejected - invalid JSON', { error: String(err) });
    return NextResponse.json({ error: 'Invalid request body', requestId }, { status: 400 });
  }

  await log.info('Unpublish request received', { user: username, postId: id });

  if (!username) {
    await log.warn('Unpublish rejected - unauthorized', { postId: id });
    return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
  }

  if (!id) {
    await log.warn('Unpublish rejected - missing entry ID', { user: username });
    return NextResponse.json({ error: 'Missing entry ID', requestId }, { status: 400 });
  }

  try {
    const updatedPost = await db.post.update({
      where: { id: Number(id) },
      data: { published: false },
      select: { id: true, title: true, authorId: true },
    });

    await log.info('Post unpublished successfully', {
      user: username,
      postId: id,
      postTitle: updatedPost.title,
      authorId: updatedPost.authorId,
    });

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    await log.error('Unpublish failed - database error', {
      user: username,
      postId: id,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to unpublish post', requestId }, { status: 500 });
  }
}
