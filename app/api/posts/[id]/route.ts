import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { logEvent } from '@/app/lib/log';

function parseCookies(cookieHeader: string | null): Record<string, string> {
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

function makeRequestId(): string {
  const hasRandomUUID = typeof crypto !== 'undefined' && 'randomUUID' in crypto;
  if (hasRandomUUID) return (crypto as unknown as { randomUUID: () => string }).randomUUID();
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// DELETE handler: extract id from the request URL to avoid typing mismatch on the second param
export async function DELETE(req: Request) {
  const requestId = makeRequestId();
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split('/').filter(Boolean);
    const idStr = parts[parts.length - 1];
    const id = Number(idStr);
    if (!id || Number.isNaN(id)) {
      console.warn('Invalid id in URL:', idStr);
      return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
    }

    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const username = cookies['username'] ?? null;
    if (!username) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    await db.post.delete({ where: { id } });

    try {
      await logEvent({
        source: 'Posts API',
        message: `Post deleted by ${username}: ${requestId}`,
        requestId,
        metadata: { userAction: 'delete_post', postId: id },
      });
    } catch (e: unknown) {
      if (e instanceof Error) console.error('logEvent failed in DELETE /api/posts/[id]', e.message);
      else console.error('logEvent failed in DELETE /api/posts/[id]', e);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof Error) console.error('/api/posts/[id] DELETE error', err.message, err);
    else console.error('/api/posts/[id] DELETE error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}