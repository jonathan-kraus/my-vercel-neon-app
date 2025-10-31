'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
type NavItemProps =
  | { href: string; label: string; currentPath?: string; onHoverPrefetch?: (href: string) => void }
  | { onClick: () => void; label: string };
const navItemClass =
  'w-full px-2 py-1 text-center rounded transition-all duration-200 ease-in-out hover:bg-blue-800 hover:text-yellow-400 hover:underline';
const activeItemClass = 'bg-green-700 text-white font-semibold border-2 border-green-400';

function normalizePath(p: string) {
  if (!p) return '/';
  if (p === '/') return '/';
  return p.endsWith('/') ? p.slice(0, -1) : p;
}

export function NavItem(props: NavItemProps) {
  if ('href' in props) {
    const hrefNorm = normalizePath(props.href);
    const currNorm = normalizePath(props.currentPath ?? '');
    const isActive = hrefNorm === currNorm;
    return (
      <Link
        href={props.href}
        prefetch
        className={`${navItemClass} ${isActive ? activeItemClass : ''}`}
        aria-current={isActive ? 'page' : undefined}
        onMouseEnter={() => props.onHoverPrefetch?.(props.href)}
      >
        {props.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={navItemClass}>
      {props.label}
    </button>
  );
}

const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const calllog = async (message: string) => {
  try {
    await fetch(`/api/log`, {
      method: 'POST',
      credentials: 'include',
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
  const pathname = usePathname();

  const [username, setUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);

  // Read cookies and/or server session. Re-run on route changes and window focus.
  async function refreshSession(mountedRef: { current: boolean }) {
    try {
      setSessionLoading(true);
      let foundName: string | null = getCookie('username') ?? null;
      if (foundName && mountedRef.current) setUsername(foundName);

      const token = getCookie('token') ?? getCookie('auth') ?? getCookie('session');
      const payload = parseJwt(token);
      if (payload) {
        if (
          !foundName &&
          ((payload as any).name || (payload as any).username || (payload as any).sub)
        ) {
          const nm = (payload as any).name ?? (payload as any).username ?? (payload as any).sub;
          foundName = nm;
          if (mountedRef.current) setUsername(foundName);
        }
        if ((payload as any).exp && mountedRef.current) {
          const expMs = (payload as any).exp * 1000;
          setExpiresAt(expMs);
          setTimeLeft(formatTimeLeft(expMs - Date.now()));
        }
      }

      const expiresStr = getCookie('expires_at');
      if (expiresStr && mountedRef.current && !expiresAt) {
        const parsed = Number(expiresStr);
        if (!Number.isNaN(parsed)) {
          setExpiresAt(parsed);
          setTimeLeft(formatTimeLeft(parsed - Date.now()));
        }
      }

      // If we still don't have a username (likely because auth cookie is HttpOnly), fetch server session
      if (!foundName) {
        try {
          const res = await fetch('/api/me', { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            if (mountedRef.current && json?.username) setUsername(json.username);
            if (mountedRef.current && json?.expiresAt) {
              const exp = Number(json.expiresAt);
              setExpiresAt(exp);
              setTimeLeft(formatTimeLeft(exp - Date.now()));
            }
          }
        } catch {
          // ignore failed fetch; leaves UI as Guest
        }
      }
    } catch (err) {
      console.error('SideNav refreshSession error', err);
    } finally {
      if (mountedRef.current) {
        setSessionLoading(false);
      }
    }
  }

  // Initial load and on route change
  useEffect(() => {
    const mountedRef = { current: true };
    // Defer to next tick to avoid synchronous state updates inside effect body
    setTimeout(() => {
      if (mountedRef.current) {
        void refreshSession(mountedRef);
      }
    }, 0);
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Re-check on window focus (user may have signed in/out elsewhere)
  useEffect(() => {
    const mountedRef = { current: true };
    const onFocus = () => refreshSession(mountedRef);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect: precise expiry boundary + lightweight minute updates
  useEffect(() => {
    if (!expiresAt) return;
    // Defer initial update to avoid synchronous state updates inside effect body
    const initId = setTimeout(() => {
      setTimeLeft(formatTimeLeft(expiresAt - Date.now()));
    }, 0);

    // Flip to "expired" exactly when it expires
    const msRemaining = Math.max(0, expiresAt - Date.now());
    const expireId = setTimeout(() => {
      setTimeLeft('expired');
    }, msRemaining);

    // Update the visible countdown once per minute until expiry
    const minuteIv = setInterval(() => {
      if (Date.now() >= expiresAt) return; // expireId will handle the flip
      setTimeLeft(formatTimeLeft(expiresAt - Date.now()));
    }, 60_000);
    return () => {
      clearTimeout(initId);
      clearTimeout(expireId);
      clearInterval(minuteIv);
    };
  }, [expiresAt]);

  // Prefetch key routes on mount (best-effort)
  useEffect(() => {
    const targets = [
      '/',
      '/authors',
      '/pstbyusr/',
      '/admin/logs/viewer',
      '/admin/db-status',
      '/admin/weather',
      '/dev/update-post',
    ];
    for (const t of targets) {
      try {
        (router as any).prefetch?.(t);
      } catch {
        // prefetch not supported in this environment; safe to ignore
      }
    }
  }, [router]);

  const handleHoverPrefetch = (href: string) => {
    try {
      (router as any).prefetch?.(href);
    } catch {
      // ignore prefetch errors
    }
  };

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

  return (
    <aside className="w-72 bg-blue-900 text-yellow-400 border-r border-blue-800 p-4 shadow-md">
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Top section: user info + 🍎 box + cookie button */}
          <div className="space-y-4 px-2 pt-2">
            <div className="text-sm text-yellow-400">User</div>
            <div className="font-medium text-yellow-300 flex items-center gap-2">
              {sessionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <span>Loading...</span>
                </>
              ) : (
                (username ?? 'Guest')
              )}
            </div>

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
          <nav className="flex flex-col gap-3 items-center text-center px-2" aria-label="Primary">
            <NavItem
              href="/"
              label="* Home *"
              currentPath={pathname}
              onHoverPrefetch={handleHoverPrefetch}
            />
            <NavItem
              href="/pstbyusr/"
              label="Posts by User"
              currentPath={pathname}
              onHoverPrefetch={handleHoverPrefetch}
            />
            <NavItem
              href="/admin/logs/viewer"
              label="Activity Logs"
              currentPath={pathname}
              onHoverPrefetch={handleHoverPrefetch}
            />
            <NavItem
              href="/authors"
              label="Authors"
              currentPath={pathname}
              onHoverPrefetch={handleHoverPrefetch}
            />
            <NavItem
              href="/admin/db-status"
              label="DbStatus"
              currentPath={pathname}
              onHoverPrefetch={handleHoverPrefetch}
            />
            <NavItem
              href="/admin/weather"
              label="Weather"
              currentPath={pathname}
              onHoverPrefetch={handleHoverPrefetch}
            />
            <NavItem
              href="/dev/update-post"
              label="Update Post"
              currentPath={pathname}
              onHoverPrefetch={handleHoverPrefetch}
            />
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
