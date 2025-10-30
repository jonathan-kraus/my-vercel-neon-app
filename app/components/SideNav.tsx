'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

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

export default function SideNav() {
  const router = useRouter();

  const handleShowCookies = () => {
    toast.custom((t) => (
      <div
        className={`bg-blue-950 text-yellow-300 p-4 rounded shadow max-w-md whitespace-pre-line ${
          t.visible ? 'animate-enter' : 'animate-leave'
        }`}
      >
        <div className="flex justify-between items-start gap-4">
          <div>
            <strong className="block mb-2">Cookie summary</strong>
            <pre className="text-sm">Cookies are hidden in this build.</pre>
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
        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="space-y-4 px-2 pt-2">
            <div className="text-sm text-yellow-400">User</div>
            <div className="font-medium text-yellow-300">Guest</div>

            <div className="text-sm text-yellow-400">
              Session: <span className="font-medium text-yellow-300">unknown</span>
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
              title="Show cookie summary"
            >
              Show cookie info
            </button>
          </div>

          <nav className="flex flex-col gap-3 items-center text-center px-2">
            <NavItem href="/" label="* Home *" />
            <NavItem href="/pstbyusr/" label="Posts by User" />
            <NavItem href="/admin/logs" label="Activity Logs" />
            <NavItem href="/authors" label="Authors" />
            <NavItem href="/logs" label="Logs" />
            <NavItem href="/admin/db-status" label="DbStatus" />
            <NavItem href="/admin/weather" label="Weather" />
            <NavItem href="/dev/update-post" label="Update Post" />
          </nav>
        </div>

        <div className="pt-4">
          <Toaster />
        </div>
      </div>
    </aside>
  );
}
