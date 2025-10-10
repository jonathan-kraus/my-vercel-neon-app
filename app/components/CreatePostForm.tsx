'use client';
import { useMockUser } from '../context/MockUserContext';

export default function CreatePostForm() {
  const user = useMockUser();

  if (!user) {
    return <p>Please click 🍎 Apple to create a post.</p>;
  }

  return (
    <form action="/api/createnewpost" method="POST">
      <input type="hidden" name="authorId" value={user.id} />
      <input type="text" name="title" placeholder="Post title" />
      <textarea name="content" placeholder="Post content" />
      <button type="submit">Create Post</button>
    </form>
  );
}

