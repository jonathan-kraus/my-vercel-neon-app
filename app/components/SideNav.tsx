import Link from 'next/link';

export default function SideNav() {
  return (
    <aside className="w-56 min-h-screen border-r p-4 hidden lg:block">
      <nav className="flex flex-col gap-3">
        <Link className="font-semibold text-lg" href="/">Home</Link>
        <Link href="/pstbyusr/">Posts by User</Link>
        <Link href="/api/authors">Authors API</Link>
        <div className="mt-6 pt-4 border-t">
          <div className="text-xs text-gray-500">Dev</div>
          <Link className="text-sm text-red-600" href="/dev/update-post">Update Post (dev)</Link>
        </div>
      </nav>
    </aside>
  );
}
