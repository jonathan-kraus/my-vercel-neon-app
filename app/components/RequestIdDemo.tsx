'use client';

import { useRequestId } from '@/app/contexts/RequestIdContext';

export default function RequestIdDemo() {
  const requestId = useRequestId();

  const makeApiCall = async () => {
    console.log(`📡 Making API call with requestId: ${requestId}`);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: 'test@example.com',
        toName: 'Test User',
        subject: 'Test Email',
        message: 'This is a test',
        requestId, // ← Same requestId from context!
      }),
    });

    const result = await response.json();
    console.log('✅ API response:', result);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Shared RequestID Demo</h1>

      <div className="p-4 bg-blue-50 rounded border border-blue-200">
        <p className="text-sm font-mono">
          <strong>Current RequestID:</strong>
          <br />
          <code className="text-blue-600">{requestId}</code>
        </p>
        <p className="text-xs text-gray-600 mt-2">
          ℹ️ This ID is shared across ALL components on this page
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm">
          Every component on this page (SideNav, DbStatus, this demo) uses the{' '}
          <strong>same requestId</strong>.
        </p>
        <p className="text-sm">
          When you make API calls, pass this requestId so all logs are linked!
        </p>
      </div>

      <button
        onClick={makeApiCall}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Make API Call (check console)
      </button>

      <div className="p-4 bg-gray-50 rounded text-sm font-mono">
        <p className="font-bold mb-2">💡 How it works:</p>
        <pre className="whitespace-pre-wrap text-xs">
          {`1. Layout.tsx wraps everything in <RequestIdProvider>
2. Provider generates ONE requestId for entire page
3. Any component calls useRequestId() to get it
4. All API calls include the same requestId
5. Server logs all use the same ID → easy tracing!`}
        </pre>
      </div>
    </div>
  );
}
