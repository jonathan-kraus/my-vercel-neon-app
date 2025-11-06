import { db } from '@/app/lib/db';
import { sendConfirmationEmail } from '@/app/utils/email-client';
import { NextResponse } from 'next/server';
import { generateUUID } from '../../../uuidj';
import { isFeatureEnabled } from '@/app/utils/featureFlags';
console.log('[build] Generating /authors');
export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? generateUUID();
  try {
    // Include a posts count for each user so clients can render badges without extra queries
    const authors = await db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    });

    console.log(`[${requestId}] Fetched authors, returning response`);
    return NextResponse.json(authors);
  } catch (error) {
    console.error(`[${requestId}] Error fetching authors:`, error);
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
  } finally {
    const emailData = {
      toEmail: 'jonathanckraus@gmail.com',
      toName: 'Jonathan',
      subject: 'Authors Route Page Clicked',
      requestId: requestId,
    };
    if (isFeatureEnabled('EMAIL_NOTIFICATIONS')) {
      const { success, message } = await sendConfirmationEmail(emailData);
      if (success) {
        console.log(`[${requestId}] Email sent successfully: ${message}`);
      } else {
        console.error(`[${requestId}] Email failed: ${message}`);
      }
    }
  }
}
