'use client';

import { useState } from 'react';

export function LogSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search logs..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border px-3 py-2 rounded w-full"
      />
      <button
        onClick={() => onSearch(query)}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Search
      </button>
    </div>
  );
}
