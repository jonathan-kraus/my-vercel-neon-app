import { db } from '@/app/lib/db';
import { sendConfirmationEmail } from '@/app/utils/email-client';
import { NextResponse } from 'next/server';
import { generateUUID } from '../../../uuidj';
import { isFeatureEnabled } from '@/app/utils/featureFlags';
import { createLogger } from '@/app/utils/logger';

export async function GET(req: Request) {
  const requestId = req.headers.get('x-request-id') ?? generateUUID();
  const log = createLogger('app/api/authors/route.ts');

  try {
    // Include a posts count for each user so clients can render badges without extra queries
    const authors = await db.user.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, _count: { select: { posts: true } } },
    });

    return NextResponse.json(authors);
  } catch (error) {
    await log.error('Error fetching authors', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
  } finally {
    const emailData = {
      toEmail: 'jonathanckraus@gmail.com',
      toName: 'Jonathan',
      subject: 'Authors Route Page Clicked',
      requestId: requestId,
    };
    if (await isFeatureEnabled('EMAIL_NOTIFICATIONS')) {
      const { success, message } = await sendConfirmationEmail(emailData);
      if (success) {
        await log.info('Email sent successfully', { success, message });
      } else {
        await log.error('Email failed', { success, message });
      }
    }
  }
}
