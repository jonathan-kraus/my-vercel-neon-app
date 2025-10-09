// app/components/CreatePostForm.tsx
"use client";

import { useState } from "react";
import { useUser } from "@stackframe/react";


type User = {
  id: number;
  name?: string | null;
  email: string;
  _count?: {
    posts: number;
  };
};

export default function CreatePostForm({ users }: { users: User[] }) {
  const [loading, setLoading] = useState(false);
const { user } = useUser(); // gives you user.id, user.name, etc.
console.log("[CreatePostForm] Current user:", user);
  async function handleCreatePost(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title"),
      content: formData.get("content"),
      authorId: user.id, // ✅ pass the signed-in user ID
    };
console.log("Creating post with payload:", payload);
    const res = await fetch("/api/createnewpost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/";
    } else {
      alert("Failed to create post");
    }
  }

  return (
    <form onSubmit={handleCreatePost} className="mb-6 flex flex-col gap-2">
      <input name="title" placeholder="Title" className="border px-2 py-1 rounded" required />
      <textarea name="content" placeholder="Content" className="border px-2 py-1 rounded text-black" required />
      <select name="authorId" className="border px-2 py-1 rounded" required defaultValue="1">
        <option value="">Select author</option>
{users.map((user) => (
  <option key={user.id} value={user.id}>
    {user.name ?? user.email} ({user._count?.posts ?? 0})
  </option>
))}

      </select>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
        {loading ? "Creating..." : "Create Post"}
      </button>
    </form>
  );
}
