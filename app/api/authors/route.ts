import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Include a posts count for each user so clients can render badges without extra queries
    const authors = await db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    });

    return NextResponse.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
  }
}
