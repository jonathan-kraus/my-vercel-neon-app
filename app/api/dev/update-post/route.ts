import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function POST(req: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/dev/update-post/route.ts');

  // Prevent accidental production use
  // if (process.env.NODE_ENV === 'production') {
  //   return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  // }

  try {
    const body = await req.json();
    const { id, title } = body;
    if (!id || !title) {
      return NextResponse.json({ error: 'id and title required' }, { status: 400 });
    }

    const updated = await db.post.update({ where: { id }, data: { title } });
    return NextResponse.json({ updated });
  } catch (err) {
    await log.error('Dev update error', { error: String(err) });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
