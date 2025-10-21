'use client';

import React, { useEffect, useState } from 'react';
  import { sendConfirmationEmail } from '@/app/utils/email-client';
function getCookie(name: string): string | null {
  const match = typeof document !== 'undefined' && document.cookie.match(new RegExp('(^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}
console.log('🔧 [PostFormClient] Component loaded');
export default function PostFormClient() {
  const [username, setUsername] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setUsername(getCookie('username'));
  }, []);

  if (!username) return null; // hide form for guests



const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setStatus('posting...');

  try {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });

    if (!res.ok) throw new Error('failed');
console.log('📨 [PostFormClient] Post created, response received');
    const post = await res.json(); // assuming your API returns the created post

    // ✅ Trigger email after successful post
    await sendConfirmationEmail({
      toEmail: 'jonathanckraus@gmail.com', // or pull from post.author.email if available
      toName: 'Jonathan',             // or post.author.name
      subject: `New post created: ${title}`,
      requestId: post.id,             // optional, if your post API returns an ID
    });
console.log('📧 [PostFormClient] Confirmation email sent for post ID:', post.id);
    setTitle('');
    setBody('');
    setStatus('posted');
  } catch (err) {
    console.error(err);
    setStatus('error posting');
  } finally {
    setTimeout(() => setStatus(null), 2000);
  }
};

  return (
    <div className="my-6 p-4 border rounded bg-white">
      <div className="text-sm text-gray-600 mb-2">Signed in as <span className="font-medium">{username}</span></div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="border p-2"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Post body"
          className="border p-2"
          rows={4}
          required
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Create post</button>
          {status && <span className="text-sm text-gray-600">{status}</span>}
        </div>
      </form>
    </div>
  );
}