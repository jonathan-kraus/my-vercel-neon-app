import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { logInfoFactory } from '@/app/utils/logger';
import { generateUUID } from '../../../../uuidj';

const logInfo = logInfoFactory('app/api/entry/unpublish/route.ts');

export async function POST(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? generateUUID();
  const cookieStore = await cookies();
  const username = cookieStore.get('username')?.value;

  console.log(`[entry/unpublish] [${requestId}] Unpublish request received from ${username}`);

  if (!username) {
    await logInfo(`Unpublish rejected - unauthorized`, { requestId }, requestId);
    return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 });
  }

  let id: string;
  try {
    const body = await req.json();
    id = body.id;
  } catch (err) {
    await logInfo(`Unpublish rejected - invalid JSON`, { error: String(err) }, requestId);
    return NextResponse.json({ error: 'Invalid request body', requestId }, { status: 400 });
  }

  if (!id) {
    await logInfo(`Unpublish rejected - missing entry ID`, { username }, requestId);
    return NextResponse.json({ error: 'Missing entry ID', requestId }, { status: 400 });
  }

  try {
    await db.post.update({
      where: { id: Number(id) },
      data: { published: false },
    });

    await logInfo(`Entry ${id} marked as unpublished`, { user: username, entryId: id }, requestId);

    return NextResponse.json({ success: true, requestId });
  } catch (err) {
    console.error(`[entry/unpublish] [${requestId}] Error:`, err);
    await logInfo(
      `Unpublish failed - database error`,
      { user: username, entryId: id, error: String(err) },
      requestId
    );
    return NextResponse.json({ error: 'Failed to unpublish post', requestId }, { status: 500 });
  }
}
