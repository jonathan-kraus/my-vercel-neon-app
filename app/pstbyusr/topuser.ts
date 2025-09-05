'use client';

import { useEffect, useState, useMemo } from 'react';

type Author = {
  id: number;
  name: string | null;
};

type BlogPost = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: Author;
};

export default function BlogViewer() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all posts on mount
  useEffect(() => {
    setLoading(true);
    fetch('/api/posts')
      .then((res) => res.json())
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch posts:", error);
        setLoading(false);
      });
  }, []);

  // Count and sort posts per author
  const topPosters = useMemo(() => {
    const postCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      const authorName = post.author?.name || 'Unknown';
      postCounts[authorName] = (postCounts[authorName] || 0) + 1;
    });

    return Object.keys(postCounts)
      .map(name => ({
        author: name,
        count: postCounts[name],
      }))
      .sort((a, b) => b.count - a.count);
  }, [posts]);

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Top Posters</h2>
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
      ) : (
        <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="py-2 px-4 text-left font-semibold text-gray-600">Author</th>
              <th className="py-2 px-4 text-left font-semibold text-gray-600">Posts</th>
            </tr>
          </thead>
          <tbody>
            {topPosters.map((poster, index) => (
              <tr key={poster.author} className={`border-b ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                <td className="py-2 px-4">{poster.author}</td>
                <td className="py-2 px-4">{poster.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
