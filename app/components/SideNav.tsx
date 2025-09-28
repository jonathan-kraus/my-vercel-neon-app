'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { triggerEmail } from './actions'; // adjust path if needed

export default function SideNav() {
  const router = useRouter();

const handleAuthorsClick = async () => {
  console.log('handleAuthorsClick!');
  toast.loading('Sending email...');
  try {
    await triggerEmail("Authorj");
    console.log('Email function completed');
   toast.success('Email sent!');
   console.log('after toast✅');
   setTimeout(() => router.push('/authors'), 1500);
   console.log('✅ Email sent and redirected to /authors');

  } catch (err) {
    console.error('Email failed:', err);
    toast.error('Email failed');
  }
};


  return (
    <aside className="w-56 min-h-screen border-r p-4 hidden lg:block">
      <nav className="flex flex-col gap-3">
        <Link className="font-semibold text-lg" href="/">* Home *</Link>
        <Link href="/pstbyusr/">Posts by User</Link>

        {/* Replace Link with button for Authors */}
        <button
          onClick={handleAuthorsClick}
          className="text-left w-full px-2 py-1 hover:bg-gray-100"
        >
          Authors
        </button>
        <Link href="/logs">Logs</Link>
        <Link href="/admin/db-status">Db Status</Link>
        <Link href="/dev/update-post">Update Post </Link> 
      </nav>
    </aside>
  );
}
