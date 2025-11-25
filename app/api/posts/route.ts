import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { createLogger } from '@/app/utils/logger';
import { Prisma } from '@prisma/client';
import { generateUUID } from '@/uuidj';
import { z } from 'zod';

const CreatePostSchema = z.object({
  title: z.never(),
  body: z.string().min(1),
});

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx > -1) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  });
  return cookies;
}

export async function GET(request: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/posts/route.ts', requestId);

  try {
    const url = new URL(request.url);
    const rawAuthor = url.searchParams.get('author');
    const author = rawAuthor?.trim() && rawAuthor.trim().length > 0 ? rawAuthor.trim() : null;

    // Use the relation filter shape Prisma expects for to-one relations: author.is
    // Cast the QueryMode to Prisma.QueryMode so `mode` is typed correctly.
    const whereClause = author
      ? {
          published: true,
          author: {
            is: {
              name: {
                contains: author,
                mode: 'insensitive' as Prisma.QueryMode,
              },
            },
          },
        }
      : { published: true };

    const posts = await db.post.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { author: true },
    });

    try {
      await log.info('[api/posts] Fetched posts', { postCount: posts.length });
    } catch {
      // non-fatal
    }

    return NextResponse.json(posts);
  } catch (error) {
    await log.error('Error fetching posts', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/posts/route.ts', requestId);

  try {
    const payload = await req.json();
    await log.info('Verifying request', { payloadSize: JSON.stringify(payload).length });
    let parsed;
    try {
      parsed = CreatePostSchema.safeParse(payload);
    } catch (zodErr) {
      await log.error('Zod validation threw: ' + String(zodErr));
      return NextResponse.json(
        { error: 'Validation error', details: String(zodErr) },
        { status: 400 }
      );
    }
    if (!parsed.success) {
      await log.warn('Post payload validation failed: ' + JSON.stringify(parsed.error.format()));
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      );
    }
    const { title, body: content } = parsed.data;

    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const username = cookies['username'] ?? null;

    if (!username) {
      await log.info('Unauthorized request - missing username cookie');
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // ensure user exists (schema uses User.name)
    let user = await db.user.findFirst({ where: { name: username } });
    if (!user) {
      user = await db.user.create({ data: { name: username, email: `${username}@example.local` } });
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
      await log.info(`Post created by ${username} `, {
        userAction: 'create_post',
        postTitle: post.title,
      });
    } catch {
      // non-fatal
    }

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    await log.error('Error creating post', { error: String(err) });
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
