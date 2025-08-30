
import { PrismaClient } from '@prisma/client';
import SendEmailButton from './SendEmailButton';

export default async function PostPage({ params }: { params: { id: string } }) {
  const prisma = new PrismaClient();
  const post = await prisma.post.findUnique({
    where: { id: Number(params.id) },
    include: { author: true },
  });

  if (!post) return <div>Post not found</div>;

  return (
    <div className="max-w-xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="mb-4">{post.content}</p>
      <p className="text-sm text-gray-500 mb-6">By {post.author?.name || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString()}</p>
      <SendEmailButton post={post} />
    </div>
  );
}
