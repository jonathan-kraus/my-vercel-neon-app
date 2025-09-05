import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const author = searchParams.get('author');

  const posts = await prisma.post.findMany({
    where: author ? { author: { name: { contains: author } } } : {},
    orderBy: { createdAt: 'desc' },
    include: { author: true },
  });

  return Response.json(posts);
}
