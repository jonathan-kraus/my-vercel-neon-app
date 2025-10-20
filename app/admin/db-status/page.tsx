import DbStatus from '@/app/components/DbStatus';
import Email from '@/app/components/email';

export default function DbStatusPage() {
  return (
    <main className="p-6">
      <DbStatus />
      
      <Email />
    </main>
  );
}
