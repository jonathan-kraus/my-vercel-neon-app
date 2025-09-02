//export const dynamic = "force-dynamic";
//import { useLocation } from 'react-router-dom';
// import Image from "next/image";
// import logo from "@/assets/logo.svg";
// import logoDark from "@/assets/logo-dark.svg";
// import Link from "next/link";
// import arrow from "@/assets/arrow.svg";
// import discord from "@/assets/discord.svg";
// import docs from "@/assets/docs.svg";
import { checkDbConnection } from "../db";
import { PrismaClient } from '@prisma/client';

type BlogPost = {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  author?: { name?: string | null };
};

// post 21 title is name
const prisma = new PrismaClient();
let myname = 'A';
const post = await prisma.post.findUnique({
  where: {
    id: 21,
  },
})
console.log(post);
myname = post?.title || 'No data found';
console.log("my name: " + myname);

export default async function Home() {

  const prisma = new PrismaClient();
  const posts = await prisma.post.findMany({
    where: 
    { author: { name: { contains: myname } } },
    orderBy: { createdAt: 'desc' },
    include: { author: true },
  });
  // const users = await prisma.user.findMany({
  //   orderBy: { name: 'asc' },
  // });
  const result = await checkDbConnection();
  console.log('Database connection result:', result);
  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 md:max-w-lg md:px-0 lg:max-w-xl">
        {/* Post List Above Main Content */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Blog Posts</h2>
          
  {posts.length === 0 ? (
  <p>No posts found...</p>
) : (
  <ul className="space-y-4">
    {posts.map((post: BlogPost, index: number) => (
      <li 
        key={post.id} 
        className={`border-b pb-2 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-sky-50'}`}
      >
        <div className="flex justify-between items-center">
          <div>
            <span className="text-lg font-semibold">{post.title}</span>
            <p className="text-sm text-gray-600">By {post.author?.name || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString()}</p>
            <p>{post.content}</p>
          </div>
        </div>
      </li>
    ))}
  </ul>
)}
        </section>
        {/* ...existing code... */}
console.log( myname);

        <main className="flex flex-1 flex-col justify-center">
          <span
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
              result === "Database connected"
                ? "border-[#00E599]/20 bg-[#00E599]/10 text-[#1a8c66] dark:bg-[#00E599]/10 dark:text-[#00E599]"
                : "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-500"
            }`}
          >
            {result}
          </span>
        </main>
  
      </div>
    </div>
  );
}
