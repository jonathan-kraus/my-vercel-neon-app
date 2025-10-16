import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { logEvent } from '@/app/lib/log';

function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}

function makeRequestId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? (crypto as any).randomUUID()
    : `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// NOTE: Next expects the second param to be { params }
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const requestId = makeRequestId();
  try {
    console.log(`[api/posts/[id]] DELETE called with params:`, params);

    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      console.warn('Invalid id param:', params.id);
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    // optional auth check
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const username = cookies['username'] ?? null;
    if (!username) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // delete post
    await db.post.delete({ where: { id } });

    try {
      await logEvent({
        source: 'Posts API',
        message: `Post deleted by ${username}: ${requestId}`,
        requestId,
        metadata: { userAction: 'delete_post', postId: id },
      });
    } catch (e) {
      console.error('logEvent failed in DELETE /api/posts/[id]', e);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('/api/posts/[id] DELETE error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}