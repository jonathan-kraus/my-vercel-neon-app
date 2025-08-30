import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

// GET /api/posts/[id] - Get a single post
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
    include: { author: true },
  });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  return NextResponse.json(post);
}

// PUT /api/posts/[id] - Update a post
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json();
  const post = await prisma.post.update({
    where: { id: Number(params.id) },
    data: {
      title: data.title,
      content: data.content,
      published: data.published,
    },
  });
  return NextResponse.json(post);
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.post.delete({
    where: { id: Number(params.id) },
  });
  return NextResponse.json({ success: true });
}
