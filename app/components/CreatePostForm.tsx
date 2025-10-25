'use client';

import { useEffect, useState } from 'react';
import { createPost } from '@/app/actions/createPost';
import toast, { Toaster } from 'react-hot-toast';
console.log('[build] Generating CreatePostForm component');
export default function CreatePostForm() {
  const [authorizedUser, setAuthorizedUser] = useState<string | null>(null);

  useEffect(() => {
    // accept either cookie name used by older flows ("authorizedUser")
    // or the client-visible username cookie we set in AuthPage ("username")
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('authorizedUser=') || row.startsWith('username='));

    if (cookie) {
      const name = decodeURIComponent(cookie.split('=')[1] ?? '');
      if (name) {
        queueMicrotask(() => setAuthorizedUser(name));
      }
    }
  }, []);

  // fallback: try /api/me (server session) to get user if cookies are HttpOnly
  (async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const json = await res.json();
        if (json?.username) setAuthorizedUser(json.username);
      }
    } catch {
      // ignore
    }
  })();

  // show toast when server indicates success (either via query param or helper cookie)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('posted') === '1') {
        toast.success('Post created');
        // remove query param to avoid repeated toasts
        params.delete('posted');
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
        return;
      }

      // cookie-based fallback: server can set post_status=success; show toast then clear it
      const postCookie = document.cookie.split('; ').find((row) => row.startsWith('post_status='));
      if (postCookie) {
        const val = postCookie.split('=')[1];
        if (val === 'success') {
          toast.success('Post created');
          // clear cookie
          document.cookie = `post_status=; Path=/; Max-Age=0`;
        }
      }
    } catch {
      // ignore errors
    }
  }, []);

  if (!authorizedUser) {
    return <p>Please click 🍎 Apple to create a post.</p>;
  }

  return (
    <>
      {/* When using a server action function as `action={createPost}`, do NOT set method/encType — React/Next handle that. */}
      <form action={createPost} className="space-y-4 max-w-md mx-auto bg-white p-4 rounded shadow">
        <input type="hidden" name="authorName" value={authorizedUser} />
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input type="text" name="title" id="title" className="w-full border p-2" required />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea name="content" id="content" className="w-full border p-2" required />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          Submit Post
        </button>
      </form>
      <Toaster />
    </>
  );
}
