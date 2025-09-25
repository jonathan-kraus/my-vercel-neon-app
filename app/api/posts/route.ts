// import { PrismaClient } from '@prisma/client';
// import { NextResponse } from 'next/server';

// const prisma = new PrismaClient();

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const author = searchParams.get('author');

//     const posts = await prisma.post.findMany({
//       where: {
//         published: true,            // Filter to only published posts
//         ...(author
//           ? {
//               author: {
//                 name: {
//                   contains: author,
//                   mode: 'insensitive',
//                 },
//               },
//             }
//           : {}),
//       },
//       orderBy: { createdAt: 'desc' },
//       include: { author: true },
//     });

//     return NextResponse.json(posts);
//   } catch (error) {
//     console.error('Error fetching posts:', error);
//     return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
//   }
// }
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Include a posts count for each user so clients can render badges without extra queries
    const authors = await prisma.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    });

    return NextResponse.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
  }
}
