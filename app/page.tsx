export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { db } from './lib/db';
import CreatePostForm from './components/CreatePostForm';
import { DeleteButton } from '@/app/components/DeleteButton';
import { MarkCompleteButton } from './components/MarkCompleteButton';
// removed client-side duplicate form import (PostFormClient)
// import PostFormClient from '@/app/components/PostFormClient';
//import { revalidatePath } from "next/cache";

const DATA = {
  title: "Jonathan's Blog",
  description: 'A blog showcasing posts with Neon.',
  button: {
    text: 'Posts by user',
    href: '/pstbyusr/',
  },
  link: {
    text: 'View on GitHub',
    href: 'https://github.com/neondatabase-labs/vercel-marketplace-neon',
  },
};

type BlogPost = {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  author?: { id?: number; name?: string | null };
};

export default async function Home() {
  const posts = await db.post.findMany({
    orderBy: { createdAt: 'desc' },
    where: { published: true },
    include: { author: true },
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Keep server-side form only (remove client duplicate) */}
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 md:max-w-lg md:px-0 lg:max-w-xl">
        {/* Post Creation + List */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Blog Posts</h2>

          {/* Server-side form component */}
          <CreatePostForm />

          {posts.length === 0 ? (
            <p>No posts found</p>
          ) : (
            <ul className="space-y-4 mt-6">
              {posts.map((post: BlogPost, index: number) => (
                <li
                  key={post.id}
                  className={`border-b pb-2 ${index % 2 === 0 ? 'bg-sky-500' : 'bg-blue-400'}`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg font-semibold">{post.title}</span>
                      <p>{post.content}</p>
                      <p className="text-sm text-navy-600">
                        By {post.author?.name || 'Unknown'}{' '}
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <DeleteButton postId={post.id} />
                      <MarkCompleteButton postId={post.id.toString()} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Branding & CTA */}
        <main className="flex flex-1 flex-col justify-center">
          <div className="mb-6 md:mb-7"></div>
          <h1
            className="text-3xl font-semibold leading-none tracking-tighter md:text-4xl lg:text-5xl"
            dangerouslySetInnerHTML={{ __html: DATA.title }}
          />
          <p
            className="mt-3.5 max-w-lg text-base leading-snug tracking-tight text-[#61646B] md:text-lg lg:text-xl dark:text-[#94979E]"
            dangerouslySetInnerHTML={{ __html: DATA.description }}
          />
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link
              className="rounded-full bg-[#00E599] px-5 py-2.5 font-semibold text-[#0C0D0D] hover:bg-[#00E5BF]"
              href={DATA.button.href}
              target="_blank"
            >
              {DATA.button.text}
            </Link>
            <Link className="group flex items-center gap-2" href={DATA.link.href} target="_blank">
              {DATA.link.text}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
