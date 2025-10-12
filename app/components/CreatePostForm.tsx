'use client';

import { useEffect, useState } from 'react';
import { createPost } from '@/app/actions/createPost'; 

export default function CreatePostForm() {
  const [authorizedUser, setAuthorizedUser] = useState<string | null>(null);

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('authorizedUser='));

    if (cookie) {
      const name = cookie.split('=')[1];
      setAuthorizedUser(name);
    }
  }, []);

  if (!authorizedUser) {
    return <p>Please click 🍎 Apple to create a post.</p>;
  }

  return (
    <form
      action={createPost}
      method="POST"
      className="space-y-4 max-w-md mx-auto bg-white p-4 rounded shadow"
    >
      <input type="hidden" name="authorName" value={authorizedUser} />
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          className="w-full border p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          name="content"
          id="content"
          className="w-full border p-2"
          required
        />
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Submit Post
      </button>
    </form>
  );
}
