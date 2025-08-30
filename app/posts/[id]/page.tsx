"use client";
import { PrismaClient } from '@prisma/client';
import { useState } from 'react';

const prisma = new PrismaClient();

export default async function PostPage({ params }: { params: { id: string } }) {
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

function SendEmailButton({ post }: { post: any }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSendEmail() {
    setLoading(true);
    setSuccess(false);
    const res = await fetch('/api/send-post-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: post.title,
        content: post.content,
        to: 'your@email.com', // Change to your recipient
      }),
    });
    setLoading(false);
    if (res.ok) setSuccess(true);
  }

  return (
    <div>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleSendEmail}
        disabled={loading}
      >
        {loading ? 'Sending...' : 'Send Post via Email'}
      </button>
      {success && <p className="text-green-600 mt-2">Email sent!</p>}
    </div>
  );
}
