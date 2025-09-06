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

  useEffect(() => {  // Fetch authors on mount
    fetch('/api/authors')
      .then((res) => res.json())
      .then((data) => setAuthors(data));
  }, []);

  useEffect(() => { // Fetch posts when selectedAuthor changes
    setLoading(true);
    fetch(`/api/posts?author=${encodeURIComponent(selectedAuthor)}`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      });
  }, [selectedAuthor]);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">
      Blog Posts {selectedAuthor && `by ${selectedAuthor}`}
      </h2>
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
      <style jsx>{`
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 0.8s linear infinite;
          margin: auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
{loading ? (
  <div className="flex justify-center items-center h-24">
    <div className="spinner" />
  </div>
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
// blob test
import { get } from '@vercel/blob';

async function readBlob(blobUrl) {

export default async function handler(req, res) {
  try {
    // Replace with your actual blob URL or key
    const blobUrl = 'https://pnz5lopkqmsuig0d.public.blob.vercel-storage.com/info12.txt';

    // Get the blob
    const response = await get(blobUrl);

    // Ensure the blob exists
    if (!response) {
      return res.status(404).json({ error: 'Blob not found' });
    }

    // Read the blob as text (you can also use response.blob() and then read as ArrayBuffer, etc.)
    const text = await response.text();

    return res.status(200).json({ content: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
// Example usage with a public blob URL

readBlob(blobUrl);