import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { db } from '../lib/db';
import { sendWithDedup } from '@/app/lib/sendWithDedup';
console.log('📦 sendemail.ts loaded');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
});

const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');
export default async function logSendEmailModuleAccess() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const severity = 'info';
  const source = 'sendemail.ts';
  const message = `sendemail.ts module accessed`;
  const requestId = crypto.randomUUID();
  const metadata = { action: 'fetch', timestamp: new Date().toISOString() };
  try {
    const lasttime = await db.log.findFirst({
      where: { message: { contains: 'email sent', mode: 'insensitive' } },
      orderBy: { timestamp: 'desc' },
    });
    console.log(`🚀 [${requestId}] sendemail.ts Last email sent at:`, lasttime?.timestamp);
    console.log(`🚀 [${requestId}] sendemail.ts Last email message:`, lasttime?.message);
  } catch (err) {
    console.error(`❌ ${requestId} [sendemail.ts] Error caught:`, err);
  }

  try {
    console.log(`🚀 [${requestId}] sendemail.ts Starting logic`);
    await db.log.create({
      data: {
        severity,
        source,
        message,
        requestId,
        metadata: metadata ?? {},
        timestamp: new Date(),
      },
    });
  } catch (err) {
    console.error(`❌ ${requestId} [sendemail.ts] Error caught:`, err);
  }
}
// ✅ Move type and logger OUTSIDE
export type LogPayload = {
  severity: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  requestId?: string;
  metadata?: Record<string, string>;
};

export async function logEvent(payload: LogPayload) {
  const baseUrl =
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    process.env.SITE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'https://www.kraus.my.id';

  const logUrl = `${baseUrl}/api/log`;
  console.log(`✅ [sendemail] start logging to: ${logUrl} with payload:`, payload);

  try {
    await logSendEmailModuleAccess();

    console.log(`[logEvent] sent to ${logUrl}`);
  } catch (err) {
    console.error(`[logEvent] failed`, err);
  }
}

// ✅ Now your email function can call it
console.log('[sendemail] sendEmailDirect function defined');
export async function sendEmailDirect(
  toEmail: string,
  toName: string,
  requestId?: string,
  subject?: string,
  message?: string
) {
  const recipients = [new Recipient(toEmail, toName)];
  const finalSubject = subject || `Mail Success Confirmation - ${toName}`;
  console.log(`[sendemail] sendEmailDirect triggered for ${toEmail} with requestId: ${requestId}`);
  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(finalSubject)
    .setText(`Sent from utils ${toName} app`)
    .setHtml(`<strong>Sent from utils ${toName} app ${message}</strong> ${requestId}`);

  const sendFn = async () => {
    await mailerSend.email.send(emailParams);
  };

  const result = await sendWithDedup({
    source: 'sendemail',
    message: `Email : ${finalSubject}`,
    requestId,
    throttleMinutes: process.env.EMAIL_THROTTLE_MINUTES ? 15 : 0,
    sendFn,
  });

  if (result.sent) {
    console.log('✅ Email from utils sent successfully to:', toEmail, toName);
    return true;
  }

  console.log('ℹ️ Email skipped:', result.reason || 'Throttled');
  return false;
}
logSendEmailModuleAccess();
