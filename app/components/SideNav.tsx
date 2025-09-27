import Link from 'next/link';

export default function SideNav() {
  return (
    <aside className="w-56 min-h-screen border-r p-4 hidden lg:block">
      <nav className="flex flex-col gap-3">
        <Link className="font-semibold text-lg" href="/">* Home *</Link>
        <Link href="/pstbyusr/">Posts by User</Link>
        <Link href="/authors">Authors</Link>
        <Link href="/mail">Mail</Link>
        <Link href="/dev/update-post">Update Post </Link> 
      </nav>
    </aside>
  );
}