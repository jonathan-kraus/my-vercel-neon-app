'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logEvent } from '@/app/lib/log';

export default function AuthPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const requestId = crypto.randomUUID();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
await logEvent({
  source: 'AuthPage',
  message: `User login attempted for ${name}  `,
  requestId,
  metadata: { userAction: 'login' },
});
    const res = await fetch('/api/checkUser', {
      method: 'POST',
      body: JSON.stringify({ name }),
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await res.json();
    if (result.exists) {
      document.cookie = `authorizedUser=${name}; path=/`; // ✅ Set cookie
      
      router.push('/'); // ✅ Redirect to home
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2"
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2">
          Login
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
