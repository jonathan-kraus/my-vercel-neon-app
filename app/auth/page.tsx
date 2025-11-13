'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/app/utils/logger';
import { generateUUID } from '../../uuidj';
const requestId = generateUUID();
const log = createLogger('app/auth/page.tsx', requestId);

export default function AuthPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // Initialize loginAttempts from localStorage (runs only once)
  const [loginAttempts, setLoginAttempts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('loginAttempts');
      if (saved) {
        const count = parseInt(saved, 10);
        console.log(`📂 Loaded ${count} attempts from localStorage`);
        return count;
      }
    }
    return 0;
  });

  const router = useRouter();

  // useEffect: Save to localStorage whenever loginAttempts changes
  useEffect(() => {
    if (loginAttempts > 0) {
      // Save to localStorage
      localStorage.setItem('loginAttempts', loginAttempts.toString());
      console.log(`💾 Saved attempt #${loginAttempts} to localStorage`);

      // Example: Show warning after 3 attempts
      if (loginAttempts >= 3) {
        console.warn('⚠️ Multiple login attempts detected!');
      }
    }
  }, [loginAttempts]); // <- Re-run whenever loginAttempts changes
  log.info('[app/auth/page] Rendering AuthPage component', {
    action: 'render',
    timestamp: new Date().toISOString(),
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Increment the attempt counter
    setLoginAttempts(loginAttempts + 1);

    try {
      // non-fatal logging
      await log.info(`[app/auth/page] User login attempted for ${name}`, {
        userAction: 'login',
        user: name,
        attemptNumber: loginAttempts + 1,
      });
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
        await log.info(`[app/auth/page] User login successful for ${name}`, {
          userAction: 'login',
          user: name,
        });
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

      {/* Display login attempt counter */}
      <div className="mb-4 p-3 bg-gray-100 rounded border">
        <p className="text-sm text-gray-700">
          Login attempts: <span className="font-bold text-blue-600">{loginAttempts}</span>
          <span className="text-xs text-gray-500 ml-2">(saved in localStorage)</span>
        </p>
        {loginAttempts >= 3 && (
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ Multiple attempts detected - check your credentials
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('loginAttempts');
            setLoginAttempts(0);
            console.log('🗑️ Cleared localStorage and reset counter');
          }}
          className="mt-2 text-xs text-red-600 hover:underline"
        >
          Reset counter
        </button>
      </div>

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
