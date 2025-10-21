'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
//import { triggerEmail } from './actions'; // adjust path if needed
import { sendConfirmationEmail } from '../utils/email-client';
const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`; 
const calllog = async (message: string) => {
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        severity: 'info',
        source: 'SideNav',
        message,
        requestId,
        metadata: { userAction: 'fetch' },
      }),
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
};
calllog(`[SideNav] [${requestId}] component loaded`);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(atob(payload).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function formatTimeLeft(ms: number) {
  if (ms <= 0) return 'expired';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export default function SideNav() {
  const router = useRouter();

  const [username, setUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // read cookie(s) on mount, fallback to server session endpoint if cookies are HttpOnly
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        let foundName: string | null = getCookie('username') ?? null;
        if (foundName && mounted) setUsername(foundName);

        const token = getCookie('token') ?? getCookie('auth') ?? getCookie('session');
        const payload = parseJwt(token);
        if (payload) {
          if (!foundName && (payload.name || payload.username || payload.sub)) {
            foundName = payload.name ?? payload.username ?? payload.sub;
            if (mounted) setUsername(foundName);
          }
          if (payload.exp && mounted) {
            const expMs = payload.exp * 1000;
            setExpiresAt(expMs);
            setTimeLeft(formatTimeLeft(expMs - Date.now()));
          }
        }

        const expiresStr = getCookie('expires_at');
        if (expiresStr && mounted && !expiresAt) {
          const parsed = Number(expiresStr);
          if (!Number.isNaN(parsed)) {
            setExpiresAt(parsed);
            setTimeLeft(formatTimeLeft(parsed - Date.now()));
          }
        }

        // If we still don't have a username (likely because auth cookie is HttpOnly),
        // attempt to fetch a server-side session endpoint that returns user info.
        if (!foundName) {
          try {
            const res = await fetch('/api/me');
            if (res.ok) {
              const json = await res.json();
              if (mounted && json?.username) setUsername(json.username);
              if (mounted && json?.expiresAt) {
                setExpiresAt(Number(json.expiresAt));
                setTimeLeft(formatTimeLeft(Number(json.expiresAt) - Date.now()));
              }
            }
          } catch {
            // ignore failed fetch; leaves UI as Guest
          }
        }
      } catch (err) {
        console.error('SideNav init error', err);
      }
    };

    init();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // separate effect to update countdown when expiresAt changes
  useEffect(() => {
    if (!expiresAt) return;
    // set immediate value
    setTimeLeft(formatTimeLeft(expiresAt - Date.now()));
    const iv = setInterval(() => {
      setTimeLeft(formatTimeLeft(expiresAt - Date.now()));
    }, 30_000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  const handleShowCookies = () => {
    // show cookie info in a non-sensitive way; avoid leaking tokens in UI
    const cookies = document.cookie || '';
    console.log('document.cookie:', cookies);
    // provide a short, safe summary to user
    const safeSummary = cookies
      .split('; ')
      .map(c => {
        const [k, v] = c.split('=');
        if (!k) return '';
        if (/token|auth|session|password|api/i.test(k)) return `${k}=<redacted>`;
        return `${k}=${decodeURIComponent(v ?? '')}`;
      })
      .join('; ');
    toast.success(`Cookies (sensitive values redacted):\n${safeSummary}`);
  };

  const handleAuthorsClick = async () => {
    console.log('handleAuthorsClick!');
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: 'SideNav',
          message: 'Author SideNav component clicked',
          requestId,
          metadata: { userAction: 'fetch' },
        }),
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }

    try {
      //await triggerEmail("Authorj", requestId);
      //console.log(`Email function completed Authorj ${requestId}`);
      const emailData = {
      toEmail: 'jonathanckraus@gmail.com',
      toName: 'Jonathan',
      subject: 'Authors Page Clicked',
      requestId: requestId,
    };
       const { success, message } = await sendConfirmationEmail(emailData);

    if (success) {
      toast.success(`[${requestId}] Success! ${message}`);
    } else {
      toast.error(`[${requestId}] Error: ${message}`);
    }
      console.log(`Email sent, navigating to /authors ${requestId}`);
      setTimeout(() => router.push('/authors'), 1500);
    } catch (err) {
      console.error(`[Email failed: ${requestId}]`, err);
      toast.error(`[${requestId}] Email failed`);
  }
};


  const handleDbStatusClick = async () => {
    console.log('handleDbStatusClick!');
        try {
      
      const emailData = {
      toEmail: 'jonathanckraus@gmail.com',
      toName: 'Jonathan',
      subject: 'DbStatus Page Clicked',
      requestId: requestId,
    };
       const { success, message } = await sendConfirmationEmail(emailData);

    if (success) {
      toast.success(`[${requestId}] [DbStatus] Success! ${message}`);
    } else {
      toast.error(`[${requestId}] [DbStatus] Error: ${message}`);
    }
      console.log(`Email sent, navigating to /DbStatus ${requestId}`);
      setTimeout(() => router.push('/admin/db-status'), 1500);
    } catch (err) {
      console.error(`[Email failed: ${requestId}]`, err);
      toast.error(`[${requestId}] Email failed`);
  }

    
    
    
    //endpoint: /admin/db-status
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: 'SideNav',
          message: 'DbStatus SideNav component clicked',
          requestId,
          metadata: { userAction: 'fetch' },
        }),
      });
      setTimeout(() => router.push('/admin/db-status'), 1500);
    } catch (err) {
      console.error('DbStatus failed:', err);
      toast.error('Action failed');
    }
  };

  const handleWeatherClick = async () => {
    console.log('handleWeatherClick!');
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: 'SideNav',
          message: 'Weather SideNav component clicked',
          requestId,
          metadata: { userAction: 'navigate' },
        }),
      });
      setTimeout(() => router.push('/admin/weather'), 1500);
    } catch (err) {
      console.error('Weather click failed:', err);
      toast.error('Action failed');
    }
  };

  return (
    <aside className="w-56 min-h-screen border-r p-4 hidden lg:block">
      <div className="flex flex-col h-full">
        <nav className="flex flex-col gap-3">
          <Link className="font-semibold text-lg" href="/">* Home *</Link>
          <Link href="/pstbyusr/">Posts by User</Link>
          <Link href="/admin/logs">Activity Logs</Link>

          <button onClick={handleAuthorsClick} className="text-left w-full px-2 py-1 hover:bg-gray-100">
            Authors
          </button>

          <Link href="/logs">Logs</Link>
          <button onClick={handleDbStatusClick} className="text-left w-full px-2 py-1 hover:bg-gray-100">
            DbStatus
          </button>
          <button onClick={handleWeatherClick} className="text-left w-full px-2 py-1 hover:bg-gray-100">
            Weather
          </button>

          <Link href="/dev/update-post">Update Post</Link>
        </nav>

        {/* User info + cookie checks pushed to bottom */}
        <div className="mt-auto pt-4 border-t">
          <div className="mb-2">
            <div className="text-sm text-gray-600">User</div>
            <div className="font-medium">
              {username ?? 'Guest'}
            </div>
          </div>

          <div className="mb-2 text-sm text-gray-600">
            Session:{' '}
            <span className="font-medium">
              {expiresAt ? (timeLeft === 'expired' ? 'expired' : `${timeLeft} left`) : 'unknown'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleShowCookies}
              className="text-left w-full px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
              title="Show cookie summary (sensitive values redacted)"
            >
              Show cookie info
            </button>

            <Link href="/auth" className="text-blue-500 hover:underline px-2 py-1">
              🍎 Apple
            </Link>
          </div>
        </div>

        <Toaster />
      </div>
    </aside>
  );
  return null;
}