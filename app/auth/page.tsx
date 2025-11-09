'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '../../uuidj';
const requestId = generateUUID();
const log = createLogger('app/auth/page.tsx',requestId);

export default function AuthPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  log.info('[app/auth/page] Rendering AuthPage component', { action: 'render', timestamp: new Date().toISOString() });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // non-fatal logging
      await log.info(
        `[app/auth/page] User login attempted for ${name}`,
        { userAction: 'login', user: name },
      );
    } catch {
      // ignore logging failures
    }

    try {
      const res = await fetch('/api/checkUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        setError('Server error validating credentials');
        return;
      }

      const result = await res.json();

      if (result?.exists) {
        const maxAge = 60 * 60; // 1 hour
        const safeName = encodeURIComponent(name);
        // client-visible cookie for display (SideNav reads this)
        document.cookie = `username=${safeName}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        // helper cookie with expiry timestamp (ms) for client countdown UI
        const expiresAt = Date.now() + maxAge * 1000;
        document.cookie = `expires_at=${expiresAt}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
        await log.info(
          `[app/auth/page] User login successful for ${name}`,
          { userAction: 'login', user: name },
        );
        router.push('/');
      } else {
        setError('[app/auth/page] Invalid credentials');
      }
    } catch (err) {
      console.error('Login error', err);
      setError('[app/auth/page] Network error');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Sign in</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2">
          Sign in
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}
