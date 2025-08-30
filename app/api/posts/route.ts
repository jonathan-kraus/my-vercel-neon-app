import { PrismaClient } from '@prisma/client';
import { sendNewPostEmail } from '../../utils/email';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET /api/posts - List all posts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';
  const authorId = searchParams.get('authorId');
  const published = searchParams.get('published');

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (authorId) {
    where.authorId = Number(authorId);
  }
  if (published !== null && published !== undefined) {
    where.published = published === 'true';
  }

  const posts = await prisma.post.findMany({
    where,
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(posts);
}

// POST /api/posts - Create a new post
export async function POST(req: NextRequest) {
  const data = await req.json();
  const post = await prisma.post.create({
    data: {
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      published: data.published ?? false,
    },
  });
  // Send email notification (replace with your recipient email)
  if (process.env.EMAIL_ENABLED !== 'false') {
    await sendNewPostEmail({
      title: post.title,
      content: post.content,
      to: 'your@email.com', // Change to your desired recipient
    });
  }
  return NextResponse.json(post);
}
