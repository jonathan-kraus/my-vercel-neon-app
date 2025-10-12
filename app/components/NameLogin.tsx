// components/NameLogin.tsx
'use client';

import { useState } from 'react';

export default function NameLogin({ onSuccess }: { onSuccess: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/checkUser', {
      method: 'POST',
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await res.json();
    if (result.exists) {
      onSuccess(name);
    } else {
      setError('Name not recognized');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2"
      />
      <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white">Enter</button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}
