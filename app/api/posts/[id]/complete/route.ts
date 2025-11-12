import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/app/lib/db';
import { generateUUID } from '../../../../../uuidj';
import { createLogger } from '@/app/utils/logger';
import { request } from 'node:https';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const cookieStore = await cookies();
  const user = cookieStore.get('authorizedUser')?.value;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.post.update({
      where: { id: Number(id) },
      data: { published: false },
    });

    // Log the action
    const requestId = generateUUID();
    const log = createLogger('app/api/posts/[id]/complete/route.ts', requestId);
    await log.info(`Post ${id} marked as unpublished`, {
      action: 'mark_complete',
      postId: id,
      user: user,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to mark post complete:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
