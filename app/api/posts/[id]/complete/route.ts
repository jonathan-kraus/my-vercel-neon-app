import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/app/lib/db';
import { logger } from '@/app/lib/logger';
import { generateUUID } from '../../../../../uuidj';

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

    await logger({
      severity: 'info',
      source: 'post.complete',
      message: `Post ${id} marked as unpublished`,
      requestId: generateUUID(),
      metadata: { user: user, action: 'mark_complete', postId: id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to mark post complete:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
