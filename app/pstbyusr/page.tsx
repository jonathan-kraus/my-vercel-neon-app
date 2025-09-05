'use client';

import { useEffect, useState } from 'react';

type Author = {
  id: number;
  name: string | null;
};

type BlogPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author?: Author;
};

export default function BlogViewer() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch authors on mount
  useEffect(() => {
    fetch('/api/authors')
      .then((res) => res.json())
      .then((data) => setAuthors(data));
  }, []);

  // Fetch posts when selectedAuthor changes
  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts?author=${encodeURIComponent(selectedAuthor)}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, [selectedAuthor]);
console.log("Selected author:", selectedAuthor);
  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Blog Posts</h2>
      <h2 className="text-2xl font-bold mb-4">Selected Author: {selectedAuthor}</h2>
      <label htmlFor="author-select" className="block mb-2 font-medium">
        Filter by Author
      </label>
      <select
        id="author-select"
        className="mb-6 w-full p-2 border rounded"
        value={selectedAuthor}
        onChange={(e) => setSelectedAuthor(e.target.value)}
      >
        <option value="">All Authors</option>
        {authors.map((author) => (
          <option key={author.id} value={author.name || ''}>
            {author.name || 'Unknown'}
          </option>
        ))}
      </select>

      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post, index) => (
            <li
              key={post.id}
              className={`border-b pb-2 ${
                index % 2 === 0 ? 'bg-gray-50' : 'bg-sky-50'
              }`}
            >
              <span className="text-lg font-semibold">{post.title}</span>
              <p>{post.content}</p>
              <p className="text-sm text-gray-600">
                By {post.author?.name || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString(
                'en-US',
                { year: 'numeric', month: '2-digit', day: '2-digit' }
              )}
              </p>
              
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
