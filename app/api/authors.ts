import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  const authors = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  return Response.json(authors);
}
