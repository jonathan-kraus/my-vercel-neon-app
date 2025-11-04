export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { db } from './lib/db';
import logo from '@/assets/logo.svg';
import logoDark from '@/assets/logo-dark.svg';
import arrow from '@/assets/arrow.svg';
import discord from '@/assets/discord.svg';
import docs from '@/assets/docs.svg';
import CreatePostForm from './components/CreatePostForm';
import { DeleteButton } from '@/app/components/DeleteButton';
import { MarkCompleteButton } from './components/MarkCompleteButton';
import SunMoonCard from './components/SunMoonCard';
import { getDailyForecast } from './lib/GetDailyForecast';
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
  footerLinks: [
    { text: 'Docs', href: 'https://neon.tech/docs/', icon: docs },
    { text: 'Discord', href: 'https://discord.com/invite/92vNTzKDGp', icon: discord },
  ],
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

  let forecastResult;
  try {
    forecastResult = await getDailyForecast();
    console.log('Home page forecast result:', forecastResult);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    forecastResult = { forecast: [] };
  }

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

        {/* Sun & Moon Information */}
        <section className="mb-8">
          <SunMoonCard forecast={forecastResult.forecast} />
        </section>

        {/* Branding & CTA */}
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
              <Image
                className="transition-transform group-hover:translate-x-1 dark:invert"
                src={arrow}
                alt="arrow"
                width={16}
                height={10}
                priority
              />
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t py-5 dark:border-[#303236]">
          <ul className="flex items-center gap-4">
            {DATA.footerLinks.map((link) => (
              <Link
                key={link.text}
                href={link.href}
                target="_blank"
                className="flex items-center gap-2 opacity-70 hover:opacity-100"
              >
                <Image
                  className="dark:invert"
                  src={link.icon}
                  alt={link.text}
                  width={16}
                  height={16}
                  priority
                />
                <span className="text-sm">{link.text}</span>
              </Link>
            ))}
          </ul>
        </footer>
      </div>
    </div>
  );
}
