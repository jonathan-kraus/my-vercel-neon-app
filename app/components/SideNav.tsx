'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { logger } from '../lib/logger';
type NavItemProps = { href: string; label: string } | { onClick: () => void; label: string };
const navItemClass =
  'w-full px-2 py-1 text-center rounded transition-all duration-200 ease-in-out hover:bg-blue-800 hover:text-yellow-400 hover:underline';
export function NavItem(props: NavItemProps) {
  if ('href' in props) {
    return (
      <Link href={props.href} className={navItemClass}>
        {props.label}
      </Link>
    );
  }

  return (
    <button onClick={props.onClick} className={navItemClass}>
      {props.label}
    </button>
  );
}

const baseUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kraus.my.id';

const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const calllog = async (message: string) => {
  try {
    await fetch(`${baseUrl}/api/log`, {
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
  const match = document.cookie.match(
    new RegExp('(^|; )' + name.replace(/([$?*|{}\\^])/g, '\\$1') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[2]) : null;
}

function parseJwt(token: string | null) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(payload)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
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
    return () => {
      mounted = false;
    };
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
    const cookies = document.cookie || '';
    const now = Date.now();

    const safePairs = cookies
      .split('; ')
      .map((c) => {
        const [key, value] = c.split('=');
        if (!key) return null;

        if (/expires_at/.test(key)) {
          const expMs = Number(decodeURIComponent(value));
          if (!Number.isNaN(expMs)) {
            const minutesLeft = Math.floor((expMs - now) / 1000 / 60);
            return `expires_at: ${minutesLeft > 0 ? `${minutesLeft} min left` : 'expired'}`;
          }
          return `expires_at: invalid`;
        }

        if (/username|stack-is-https|__vercel_toolbar/.test(key)) {
          return `${key}: ${decodeURIComponent(value ?? '')}`;
        }

        if (/token|auth|session|password|api/i.test(key)) {
          return `${key}: <redacted>`;
        }

        return null;
      })
      .filter(Boolean);

    const summary = safePairs.length > 0 ? safePairs.join('\n') : 'No readable cookies found.';

    toast.custom((t) => (
      <div
        className={`bg-blue-950 text-yellow-300 p-4 rounded shadow max-w-md whitespace-pre-line ${
          t.visible ? 'animate-enter' : 'animate-leave'
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <strong className="block mb-2">Cookie summary</strong>
            <pre className="text-sm">{summary}</pre>
          </div>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-yellow-300 hover:text-yellow-500 text-xl font-bold"
            title="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    ));
  };

  const handleAuthorsClick = async () => {
    console.log('handleAuthorsClick!');
    try {
      await logger({
        severity: 'info',
        source: 'SideNav with logger',
        message: `Author SideNav component clicked`,
        requestId,
        metadata: { userAction: 'fetch' },
      });
    } catch (error) {
      console.error('[sidenav] [requestId] Failed to log event:', error);
    }

    console.log(`Navigating to /authors ${requestId}`);
    setTimeout(() => router.push('/authors'), 100);
  };
  <NavItem href="/logs" label="Logs" />;
  const handleDbStatusClick = async () => {
    console.log('handleDbStatusClick!');
    console.log(`[DbStatus] Clicked, navigating to /DbStatus ${requestId}`);
    try {
      await logger({
        severity: 'info',
        source: 'sidenav with logger',
        message: `DbStatus SideNav component clicked`,
        requestId,
        metadata: { userAction: 'fetch', Component: 'DbStatus' },
      });
      setTimeout(() => router.push('/admin/db-status'), 100);
    } catch (err) {
      console.error('DbStatus failed:', err);
      toast.error('Action failed');
    }
  };

  const handleWeatherClick = async () => {
    console.log('handleWeatherClick!');
    try {
      await fetch(`${baseUrl}/api/log`, {
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
      setTimeout(() => router.push('/admin/weather'), 100);
    } catch (err) {
      console.error('Weather click failed:', err);
      toast.error('Action failed');
    }
  };

  return (
    <aside className="w-72 bg-blue-900 text-yellow-400 border-r border-blue-800 p-4 shadow-md">
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Top section: user info + 🍎 box + cookie button */}
          <div className="space-y-4 px-2 pt-2">
            <div className="text-sm text-yellow-400">User</div>
            <div className="font-medium text-yellow-300">{username ?? 'Guest'}</div>

            <div className="text-sm text-yellow-400">
              Session:{' '}
              <span className="font-medium text-yellow-300">
                {expiresAt ? (timeLeft === 'expired' ? 'expired' : `${timeLeft} left`) : 'unknown'}
              </span>
            </div>

            <Link
              href="/auth"
              className="block bg-red-300 text-blue-950 p-3 rounded shadow text-center font-semibold hover:animate-wiggle"
            >
              🍎 Apple
            </Link>

            <button
              onClick={handleShowCookies}
              className="w-full px-2 py-1 bg-blue-800 text-yellow-300 hover:bg-blue-700 rounded text-sm"
              title="Show cookie summary (sensitive values redacted)"
            >
              Show cookie info
            </button>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-3 items-center text-center px-2">
            <NavItem href="/" label="* Home *" />
            <NavItem href="/pstbyusr/" label="Posts by User" />
            <NavItem href="/admin/logs/viewer" label="Activity Logs" />
            <NavItem onClick={handleAuthorsClick} label="Authors" />
            <NavItem href="/logs" label="Logs" />
            <NavItem onClick={handleDbStatusClick} label="DbStatus" />
            <NavItem onClick={handleWeatherClick} label="Weather" />
            <NavItem href="/dev/update-post" label="Update Post" />
          </nav>
        </div>

        {/* Toaster stays pinned at bottom */}
        <div className="pt-4">
          <Toaster />
        </div>
      </div>
    </aside>
  );
}
