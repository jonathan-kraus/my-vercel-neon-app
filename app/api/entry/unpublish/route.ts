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

  await log.info('Unpublish request received', { user: username });

  if (!username) {
    await log.info(`Unpublish rejected - unauthorized`, { requestId });
    return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
  }

  let id: string;
  try {
    const body = await req.json();
    id = body.id;
  } catch (err) {
    await log.info(`Unpublish rejected - invalid JSON`, { error: String(err) });
    return NextResponse.json({ error: 'Invalid request body', requestId }, { status: 400 });
  }

  if (!id) {
    await log.info(`Unpublish rejected - missing entry ID`, { username });
    return NextResponse.json({ error: 'Missing entry ID', requestId }, { status: 400 });
  }

  try {
    await db.post.update({
      where: { id: Number(id) },
      data: { published: false },
    });

    await log.info(`Entry ${id} marked as unpublished`, { user: username, entryId: id });

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    await log.error('Unpublish failed - database error', {
      user: username,
      entryId: id,
      error: String(err),
    });
    return NextResponse.json({ error: 'Failed to unpublish post', requestId }, { status: 500 });
  }
}
