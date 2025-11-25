'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { createPost } from '@/app/actions/createPost';
import toast from 'react-hot-toast';
console.log('[build] Generating CreatePostForm component');
export default function CreatePostForm() {
  const [authorizedUser, setAuthorizedUser] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    setAuthorizedUser(formData.get('authorName') as string);
    setFieldErrors({});
    try {
      startTransition(true);
      // Client-side Zod validation
      const schema = z.object({
        title: z.string().min(1, 'Title is required'),
        content: z.string().min(1, 'Content is required'),
        authorName: z.string().min(1, 'Author name is required'),
        followUpDate: z.string().optional(),
        followUpNotes: z.string().optional(),
      });
      const values = {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        authorName: formData.get('authorName') as string,
        followUpDate: formData.get('followUpDate') as string,
        followUpNotes: formData.get('followUpNotes') as string,
      };
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        // Show field-level errors
        const errors: Record<string, string> = {};
        const fieldErrors = parsed.error.flatten().fieldErrors;
        (['title', 'content', 'authorName', 'followUpDate', 'followUpNotes'] as const).forEach(
          (key) => {
            const errArr = fieldErrors[key];
            if (errArr && errArr.length > 0) errors[key] = errArr[0];
          }
        );
        setFieldErrors(errors);
        toast('Please fix the highlighted errors.', {
          icon: '⚠️',
          style: { background: '#fffbe6', color: '#b45309' },
        });
        return;
      }
      // Server action
      const result = await createPost(formData);
      if (!result) {
        toast('No response from server', {
          icon: '❌',
          style: { background: '#fee2e2', color: '#991b1b' },
        });
        return;
      }
      if (result.success) {
        toast('Post created: ' + result.postTitle, {
          icon: '✅',
          style: { background: '#dcfce7', color: '#166534' },
        });
        e.currentTarget.reset();
      } else {
        // Show server error details if available
        if (result.error && typeof result.error === 'string') {
          try {
            const errorObj = JSON.parse(result.error);
            if (errorObj && typeof errorObj === 'object') {
              setFieldErrors(errorObj);
            }
          } catch {
            // Not JSON, just show as toast
            toast(result.error, { icon: '❌', style: { background: '#fee2e2', color: '#991b1b' } });
          }
        } else {
          toast('Failed to create post', {
            icon: '❌',
            style: { background: '#fee2e2', color: '#991b1b' },
          });
        }
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
          {fieldErrors.title && <p className="text-red-600 text-xs mt-1">{fieldErrors.title}</p>}
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <textarea name="content" id="content" className="w-full border p-2" required />
          {fieldErrors.content && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.content}</p>
          )}
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
          {fieldErrors.followUpDate && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.followUpDate}</p>
          )}
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
          {fieldErrors.followUpNotes && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.followUpNotes}</p>
          )}
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
