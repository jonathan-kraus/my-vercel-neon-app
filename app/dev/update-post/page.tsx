"use client";

import { useState } from 'react';
console.log('[build] Generating /dev/update-post page');


export default function UpdatePostDev() {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [result, setResult] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    try {
      const res = await fetch('/api/dev/update-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: Number(id), title }),
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setResult(String(err));
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dev: Update Post</h1>
      <form onSubmit={submit} className="flex flex-col gap-3 max-w-md">
        <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Post ID" className="border p-2 rounded" />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New Title" className="border p-2 rounded" />
        <button className="bg-red-600 text-white py-2 px-4 rounded" type="submit">Update</button>
      </form>
      {result && (
        <pre className="mt-4 bg-gray-100 p-3 rounded text-sm">{result}</pre>
      )}
    </div>
  );
}
