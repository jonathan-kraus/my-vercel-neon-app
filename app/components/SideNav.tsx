'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { triggerEmail } from './actions'; // adjust path if needed
//import { useMockUser, useMockUserSetter } from '@/app/context/MockUserContext';


const requestId = crypto.randomUUID(); 
export default function SideNav() {
const router = useRouter();
//const setUser = useMockUserSetter();
//const user = useMockUser();
//console.log('Current mock user:', user);
const handleAuthorsClick = async () => {
  console.log('handleAuthorsClick!');
const logEvent = async () => {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: 'SideNav',
          message: 'Author SideNav component clicked',
          requestId: requestId, // or generate dynamically
          metadata: { userAction: 'fetch' },
        }),
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  };

  logEvent();  
  //createLog({authorId: 1101,title: 'SideNav',content: `Author SideNav component`});
  //toast.loading('Sending email...');
  try {
    await triggerEmail("Authorj", requestId);
    console.log(`Email function completed Authorj ${requestId}`);
   //toast.success('Email sent!');
   console.log('after toast✅');
   setTimeout(() => router.push('/authors'), 1500);
   console.log('✅ Email sent and redirected to /authors');

  } catch (err) {
    console.error('Email failed:', err);
    toast.error('Email failed');
  }
};
const handleDbStatusClick = async () => {
  console.log('handleDbStatusClick!');
  //createLog({authorId: 1101,title: 'SideNav',content: `DbStatus SideNav component`});
  //toast.loading('Sending email...');
  try {
   await triggerEmail("DbStatus", requestId);
   console.log('Email function was here');
   //toast.success('Email sent!');
   console.log('after toast✅');
   setTimeout(() => router.push('/admin/db-status'), 1500);
   console.log('✅ Email sent and redirected to /admin/db-status');

  } catch (err) {
    console.error('Email failed:', err);
    toast.error('Email failed');
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
        requestId: requestId, // or generate dynamically
        metadata: { userAction: 'navigate' },
      }),
    });
   console.log('Log event created for Weather click');

   console.log('after toast✅');
   setTimeout(() => router.push('/admin/weather'), 1500);
   console.log('✅ Redirected to /admin/weather');

  } catch (err) {
    console.error('Email failed:', err);
    toast.error('Email failed');
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

        {/* Push this to the bottom */}
        <Link href="/auth" className="text-blue-500 hover:underline">
          🍎 Apple
        </Link>


        <Toaster />
      </div>
    </aside>
  );
}