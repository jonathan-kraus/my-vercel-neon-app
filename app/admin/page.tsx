// app/admin/page.tsx
'use client';

import { useState } from 'react';
import NameLogin from '@/app/components/NameLogin';

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState('');

  if (!authorized) {
    return <NameLogin onSuccess={(name) => { setAuthorized(true); setUserName(name); }} />;
  }

  return (
    <div>
      <h1>Welcome, {userName}</h1>
      {/* Your protected content here */}
    </div>
  );
}
