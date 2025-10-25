import DbStatus from '@/app/components/DbStatus';
import Email from '@/app/components/email';
console.log('[build] Generating /admin/db-status page');
import { sendConfirmationEmail } from '@/app/utils/email-client';

export default async function DbStatusPage() {
  const requestId = crypto.randomUUID();

  try {
    await sendConfirmationEmail({
      toEmail: 'jonathanckraus@gmail.com',
      toName: 'Jonathan',
      subject: `DbStatus Page Accessed - ${new Date().toISOString()}`,
      requestId,
    });
    console.log(`[${requestId}] Email sent from DbStatusPage`);
  } catch (err) {
    console.error(`[${requestId}] Email failed from DbStatusPage`, err);
  }

  return (
    <main className="p-6">
      <DbStatus />
      <Email sendOnMount={false} />
    </main>
  );
}
