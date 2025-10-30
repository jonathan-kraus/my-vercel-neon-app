'use client';

import { useEffect, useState } from 'react';
import PostCountBadge from '../components/PostCountBadge';

type Author = {
  id: number;
  name: string | null;
  _count?: { posts: number };
};

type BlogPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author?: Author;
};

//import { list } from '@vercel/blob';
//const blobs = await list({ cursor: '', limit: 10, token: 'vercel_blob_rw_pnz5lOPKqmsUig0D_VdUKDyLDEMnMnruXjJR4IttVSCjAuX' }); // Limit to 10 blobs
//const blobs = await list({ cursor: '', limit: 100, token: 'vercel_blob_rw_pnz5lOPKqmsUig0D_VdUKDyLDEMnMnruXjJR4IttVSCjAuX' });
//console.log('blobs:', blobs);
// import * as vercelBlob from '@vercel/blob';
// const abortController = new AbortController();

// try {
//   const blobPromise = vercelBlob.put('hello.txt', 'Hello World!', {
//     access: 'public',
//     abortSignal: abortController.signal,
//   });

//   const timeout = setTimeout(() => {
//     // Abort the request after 1 second
//     abortController.abort();
//   }, 1000);

//   const blob = await blobPromise;

//   console.info('blob put request completed', blob);

//   clearTimeout(timeout);

//   //return blob.url;
// } catch (error) {
//   if (error instanceof vercelBlob.BlobRequestAbortedError) {
//     // Handle the abort
//     console.info('canceled put request');
//   }

//   // Handle other errors
// }
export default function BlogViewer() {
  // ...existing code...
  //createLog({authorId: 1101,title: 'pstbyusr page',content: `pstbyusr page visited `});
  const [authors, setAuthors] = useState<Author[]>([]);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Fetch authors on mount
    fetch('/api/authors')
      .then((res) => res.json())
      .then((data) => setAuthors(data));
  }, []);

  useEffect(() => {
    // Fetch posts when selectedAuthor changes
    queueMicrotask(() => setLoading(true));
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
            {author.name || 'Unknown'} {`(${author._count?.posts ?? 0})`}
          </option>
        ))}
      </select>
      <style jsx>{`
        .spinner {
          border: 4px solid #71277aff;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 0.8s linear infinite;
          margin: auto;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
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
              className={`border-b pb-2 ${index % 2 === 0 ? 'bg-blue-500' : 'bg-fuchsia-500'}`}
            >
              <span className="text-lg font-semibold">{post.title}</span>
              <p>{post.content}</p>
              <p className="text-sm text-gray-600">
                By {post.author?.name || 'Unknown'}
                <PostCountBadge
                  count={authors.find((a) => a.id === post.author?.id)?._count?.posts ?? 0}
                />
                on{' '}
                {new Date(post.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
