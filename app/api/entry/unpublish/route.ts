import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const username = cookieStore.get('username')?.value;

  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
  }

  try {
    await db.post.update({
      where: { id },
      data: { published: false },
    });

    await logger({
      severity: 'info',
      source: 'entry.unpublish',
      message: `Entry ${id} marked as unpublished`,
      requestId: crypto.randomUUID(),
      metadata: { user: username, entryId: id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to unpublish entry:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
