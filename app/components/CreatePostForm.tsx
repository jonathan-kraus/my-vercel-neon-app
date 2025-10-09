'use client';
//import { useUser } from "@stackframe/react";

export default function CreatePostForm() {
  //const user = useUser();
  const user = { id: "J" }; // Mock user for testing purposes
  if (!user) {
    return <p>Please sign in to create a post.</p>; // early exit if not signed in
  }

  console.log("[CreatePostForm] Current user:", user); // runs only if user exists

  return (
    <form action="/api/createnewpost" method="POST">
      <input type="hidden" name="authorId" value={user.id} />
      <input type="text" name="title" placeholder="Post title" />
      <textarea name="content" placeholder="Post content" />
      <button type="submit">Create Post</button>
    </form>
  );
}
