import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';
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

export async function GET(request: Request) {
  const requestId = makeRequestId();
  try {
    const { searchParams } = new URL(request.url);
    const author = searchParams.get('author');

    const posts = await db.post.findMany({
      where: {
        published: true,
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

    try {
      await logEvent({
        source: 'Posts API',
        message: `Posts API accessed: ${requestId}`,
        requestId,
        metadata: { userAction: 'fetch' },
      });
    } catch (e) {
      console.error('logEvent failed in GET /api/posts', e);
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = makeRequestId();
  try {
    const payload = await req.json();
    const { title, body: content } = payload || {};
    if (!title || !content) {
      return NextResponse.json({ error: 'title and body required' }, { status: 400 });
    }

    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const username = cookies['username'] ?? null;

    if (!username) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // Use `name` field (matches Prisma schema) instead of `username`
    let user;
    try {
      user = await db.user.findFirst({ where: { name: username } });
    } catch (e) {
      console.error('User lookup failed in /api/posts:', e);
      return NextResponse.json({ error: 'user_lookup_failed' }, { status: 500 });
    }

    if (!user) {
      try {
        user = await db.user.create({ data: { name: username } });
      } catch (e) {
        console.error('User create failed in /api/posts:', e);
        return NextResponse.json({ error: 'user_create_failed' }, { status: 500 });
      }
    }

    const post = await db.post.create({
      data: {
        title,
        content,
        published: true,
        author: { connect: { id: user.id } },
      },
    });

    try {
      await logEvent({
        source: 'Posts API',
        message: `Post created by ${username}: ${requestId}`,
        requestId,
        metadata: { userAction: 'create_post', postId: post.id },
      });
    } catch (e) {
      console.error('logEvent failed in POST /api/posts', e);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error('/api/posts error', err);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
