export const dynamic = "force-dynamic";
import Image from "next/image";
import logo from "@/assets/logo.svg";
import logoDark from "@/assets/logo-dark.svg";
import Link from "next/link";
import arrow from "@/assets/arrow.svg";
import discord from "@/assets/discord.svg";
import docs from "@/assets/docs.svg";
import { createLog } from './utils/db';
import { sendConfirmationEmail } from "./utils/sendemail";
import { triggerEmail } from "./components/actions";
//import { useNavigate } from 'react-router-dom';
//import { checkDbConnection } from "./db";
const DATA = {
  title: "Jonathan's Blog",
  description: "A blog showcasing posts with Neon.",
  button: {
    text: `Posts by user`,
    href: `/pstbyusr/`,
  },

  link: {
    text: "View on GitHub",
    href: "https://github.com/neondatabase-labs/vercel-marketplace-neon",
  },
  footerLinks: [
    {
      text: "Docs",
      href: "https://neon.tech/docs/",
      icon: docs,
    },
    {
      text: "Discord",
      href: "https://discord.com/invite/92vNTzKDGp",
      icon: discord,
    },
  ],
};



import { PrismaClient } from '@prisma/client';

type BlogPost = {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  author?: { id?: number; name?: string | null };
};
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import PostCountBadge from './components/PostCountBadge';

async function createPost(formData: FormData) {
  'use server';
  const prisma = new PrismaClient();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const authorId = Number(formData.get('authorId'));
  const post = await prisma.post.create({
    data: {
      title,
      content,
      authorId,
      published: true,
    },
  });
  

try {
    await sendConfirmationEmail(
      'jonathanckraus@gmail.com',
      `Title "${post.title}" content ${post.content} created at ${post.createdAt}`
    );
    await triggerEmail("Createpostj", post.content);
    console.log('✅ Email sent with post info');
    createLog({authorId: 1101,title: 'create post',content: `Title "${post.title}" content ${post.content} `});
  } catch (err) {
    console.error('❌ Email failed to send:', err);
  } 
  
  revalidatePath('/');
  redirect('/');
}



async function deletePost(formData: FormData) {
  'use server';
  const prisma = new PrismaClient();
  const id = Number(formData.get('id'));
  await prisma.post.delete({ where: { id } });
  console.log(`Deleted post with id: ${id}`);
  revalidatePath('/');
}

export default async function Home() {
  const prisma = new PrismaClient();
  const myspace = ' '
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    where: { published: { equals: true } },
    include: { author: true },
  });
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  });
  // Build a fast lookup for each user's post count so we can show a badge in the UI
  const userCounts = new Map<number, number>(users.map((u) => [u.id, u._count?.posts ?? 0]));
  //const result = await checkDbConnection();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 md:max-w-lg md:px-0 lg:max-w-xl">
        {/* Post List Above Main Content */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Blog Posts</h2>
          <form action={createPost} className="mb-6 flex flex-col gap-2">
            <input name="title" placeholder="Title" className="border px-2 py-1 rounded" required />
            <textarea name="content" placeholder="Content 1.42"  
            className="border px-2 py-1 rounded text-black" required />
            <select name="authorId" 
             className="border px-2 py-1 rounded"
             required defaultValue="1">
              <option value="">Select author</option>
              {users.map((user: { id: number; name: string | null; email: string; _count?: { posts: number } }) => (
                  <option key={user.id} value={user.id}>{user.name || user.email} ({user._count?.posts ?? 0})</option>
                ))}
            </select>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Post</button>
          </form>
  {posts.length === 0 ? (
  <p>  No posts found  </p>
) : (
  <ul className="space-y-4">
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
              By {post.author?.name || 'Unknown'}
              <PostCountBadge count={userCounts.get(post.author?.id ?? 0) ?? 0} />
              {myspace} on {new Date(post.createdAt).toLocaleDateString(
                'en-US',
                { year: 'numeric', month: '2-digit', day: '2-digit' }
              )}
            </p>
          </div>
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" className="text-sky-600 ml-4">Delete</button>
          </form>
        </div>
      </li>
    ))}
  </ul>
)}

        </section>
        {/* ...existing code... */}
        <main className="flex flex-1 flex-col justify-center">
          <div className="mb-6 md:mb-7">
            <Image
              className="lg:h-7 lg:w-auto dark:hidden"
              src={logo}
              alt="Neon logo"
              width={88}
              height={24}
              priority
            />
            <Image
              className="hidden lg:h-7 lg:w-auto dark:block"
              src={logoDark}
              alt="Neon logo"
              width={88}
              height={24}
              priority
            />
          </div>
          <h1
            className="text-3xl font-semibold leading-none tracking-tighter md:text-4xl md:leading-none lg:text-5xl lg:leading-none"
            dangerouslySetInnerHTML={{ __html: DATA.title }}
          />
          <p
            className="mt-3.5 max-w-lg text-base leading-snug tracking-tight text-[#61646B] md:text-lg md:leading-snug lg:text-xl lg:leading-snug dark:text-[#94979E]"
            dangerouslySetInnerHTML={{ __html: DATA.description }}
          />
          <div className="mt-8 flex flex-wrap items-center gap-5 md:mt-9 lg:mt-10">
            <Link
              className="rounded-full bg-[#00E599] px-5 py-2.5 font-semibold tracking-tight text-[#0C0D0D] transition-colors duration-200 hover:bg-[#00E5BF] lg:px-7 lg:py-3"
              href={DATA.button.href}
              target="_blank"
            >
              {DATA.button.text}
            </Link>
            <Link
              className="group flex items-center gap-2 leading-none tracking-tight"
              href={DATA.link.href}
              target="_blank"
            >
              {DATA.link.text}
              <Image
                className="transition-transform duration-200 group-hover:translate-x-1 dark:invert"
                src={arrow}
                alt="arrow"
                width={16}
                height={10}
                priority
              />
            </Link>
          </div>
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E5E7] py-5 sm:gap-2 sm:gap-6 md:pb-12 md:pt-10 dark:border-[#303236]">
          <ul className="flex items-center gap-4 sm:gap-6">
            {DATA.footerLinks.map((link) => (
              <Link
                className="flex items-center gap-2 opacity-70 transition-opacity duration-200 hover:opacity-100"
                key={link.text}
                href={link.href}
                target="_blank"
              >
                <Image
                  className="dark:invert"
                  src={link.icon}
                  alt={link.text}
                  width={16}
                  height={16}
                  priority
                />
                <span className="text-sm tracking-tight">{link.text}</span>
              </Link>
            ))}
          </ul>
          {/* <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              result === "Database connected"
                ? "border-[#00E599]/20 bg-[#00E599]/10 text-[#1a8c66] dark:bg-[#00E599]/10 dark:text-[#00E599]"
                : "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-500"
            }`}
          >
            {result}
          </span> */}
        </footer>
      </div>
    </div>
  );
}
// Note: avoid running database writes at module scope. If you need to run one-off updates,
// perform them inside a server action or a local script (not during build).