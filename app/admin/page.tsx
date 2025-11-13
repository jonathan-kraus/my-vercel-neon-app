// app/admin/page.tsx
'use client';

import { useState } from 'react';
import NameLogin from '@/app/components/NameLogin';
import { useRequestId } from '@/app/contexts/RequestIdContext';
import RequestIdDemo from '@/app/components/RequestIdDemo';

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [userName, setUserName] = useState('');
  const requestId = useRequestId();

  if (!authorized) {
    return (
      <NameLogin
        onSuccess={(name) => {
          setAuthorized(true);
          setUserName(name);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Welcome, {userName}</h1>

      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
        <p className="text-sm">
          <strong>Admin Page RequestID:</strong> <code className="text-green-700">{requestId}</code>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          ℹ️ This same ID is used by SideNav, DbStatus, and all other components
        </p>
      </div>

      <RequestIdDemo />
    </div>
  );
}
