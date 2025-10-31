export const dynamic = 'force-dynamic';

import DbStatus from '@/app/components/DbStatus';
import Email from '@/app/components/email';
console.log('[build] Generating /admin/db-status page');
// import { sendConfirmationEmail } from '@/app/utils/email-client'; // Removed to prevent spam

export default function DbStatusPage() {
  // Email sending moved to on-demand button in DbStatus component

  return (
    <main className="p-6">
      <DbStatus />
      <Email sendOnMount={false} />
    </main>
  );
}
