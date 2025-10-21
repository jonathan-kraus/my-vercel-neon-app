import DbStatus from '@/app/components/DbStatus';
import Email from '@/app/components/email';
console.log('[build] Generating /admin/db-status page');

export default function DbStatusPage() {
  return (
    <main className="p-6">
      <DbStatus />
      
      <Email />
    </main>
  );
}
