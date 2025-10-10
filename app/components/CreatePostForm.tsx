'use client';
import { useMockUser } from '../context/MockUserContext';

export default function CreatePostForm() {
  const user = useMockUser();

  if (!user) {
    return <p>Please click 🍎 Apple to create a post.</p>;
  }

  return (
    <form action="/api/createnewpost" method="POST" className="space-y-4 max-w-md mx-auto bg-white p-4 rounded shadow">
  <div>
    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
    <input
      type="text"
      id="title"
      name="title"
      placeholder="Post title"
      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>

  <div>
    <label htmlFor="content" className="block text-sm font-medium text-gray-700">Content</label>
    <textarea
      id="content"
      name="content"
      placeholder="Post content"
      className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
    />
  </div>

  <input type="hidden" name="authorId" value="1" />

  <button
    type="submit"
    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
  >
    Create Post
  </button>
</form>

  );
}

