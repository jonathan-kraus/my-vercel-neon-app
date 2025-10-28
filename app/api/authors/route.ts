import { db } from '@/app/lib/db';
import { sendConfirmationEmail } from '@/app/utils/email-client';
import { NextResponse } from 'next/server';
console.log('[build] Generating /authors');

export async function GET() {
  const requestId = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
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
      message: `The /authors route was accessed at ${new Date().toISOString()}`,
    };
    const { success, message } = await sendConfirmationEmail(emailData);
    if (success) {
      console.log(`[${requestId}] Email sent successfully: ${message}`);
    } else {
      console.error(`[${requestId}] Email failed: ${message}`);
    }
  }
}
