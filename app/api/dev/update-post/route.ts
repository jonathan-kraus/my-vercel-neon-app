import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  // Prevent accidental production use
  if (process.env.NODE_ENV < 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, title } = body;
    if (!id || !title) {
      return NextResponse.json({ error: 'id and title required' }, { status: 400 });
    }

    const updated = await prisma.post.update({ where: { id }, data: { title } });
    return NextResponse.json({ updated });
  } catch (err) {
    console.error('Dev update error:', err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
