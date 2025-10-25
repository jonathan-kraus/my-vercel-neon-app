'use client';

import React from 'react';
import { useState } from 'react';

type NameLoginProps = {
  onSuccess: (_name: string) => void;
};

export default function NameLogin({ onSuccess }: NameLoginProps) {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/checkUser', {
      method: 'POST',
      body: JSON.stringify({ name: userName }),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await res.json();
    if (result.exists) {
      onSuccess(userName);
    } else {
      setError('Name not recognized');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Enter your name"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="border p-2"
      />
      <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white">
        Enter
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </form>
  );
}
