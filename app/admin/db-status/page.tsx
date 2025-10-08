import DbStatus from '@/app/components/DbStatus';
import toast from 'react-hot-toast';

// Log a page visit event when this page is rendered  (you can adjust the event details as needed)
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        severity: 'info',
        source: 'admin/db-status/page.tsx',
        message: 'DbStatus component clicked',
        requestId: 'In db-status', // or generate dynamically
        metadata: { userAction: 'navigate' },
      }),
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
toast.success('In db-status page!');

export default function DbStatusPage() {
  return (
    <main className="p-6">
      <DbStatus />
    </main>
  );
}
