'use client';

import { useEffect, useState } from 'react';
import { createPost } from '@/app/actions/createPost';
import toast from 'react-hot-toast';
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
  }, []);

  // useTransition for pending state
  const [isPending, startTransition] = useState(false);

  // Client-side submit handler for toast feedback
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setAuthorizedUser(formData.get('authorName') as string); // keep user in sync
    // Show loading state
    try {
      startTransition(true);
      const result = await createPost(formData);
      if (!result) {
        toast.error('No response from server');
        return;
      }
      if (result.success) {
        toast.success(`Post created: ${result.postTitle}`);
        e.currentTarget.reset();
      } else {
        toast.error(result.error || 'Failed to create post');
      }
    } finally {
      startTransition(false);
    }
  };

  if (!authorizedUser) {
    return <p>Please click 🍎 Apple to create a post.</p>;
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto bg-white p-4 rounded shadow"
      >
        <input type="hidden" name="authorName" value={authorizedUser ?? ''} />
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
        <div>
          <label htmlFor="followUpDate" className="block text-sm font-medium text-gray-700">
            Follow-up Date (optional)
          </label>
          <input
            type="datetime-local"
            name="followUpDate"
            id="followUpDate"
            className="w-full border p-2"
          />
        </div>
        <div>
          <label htmlFor="followUpNotes" className="block text-sm font-medium text-gray-700">
            Follow-up Notes (optional)
          </label>
          <textarea
            name="followUpNotes"
            id="followUpNotes"
            className="w-full border p-2"
            placeholder="What needs to be done?"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {isPending ? 'Submitting...' : 'Submit Post'}
        </button>
      </form>
    </>
  );
}
