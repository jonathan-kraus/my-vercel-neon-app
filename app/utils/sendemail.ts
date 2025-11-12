import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { db } from '../lib/db';
import { sendWithDedup } from '@/app/lib/sendWithDedup';
import { generateUUID } from '@/uuidj';
import { createLogger } from './logger';
console.log('📦 sendemail.ts loaded');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
});
const requestId = generateUUID();
const log = createLogger('app/utils/sendemail.ts', '[logSendEmailModuleAccess], Initialize');
const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');
export default async function logSendEmailModuleAccess() {
  try {
    const lasttime = await db.log.findFirst({
      where: { message: { contains: 'email sent', mode: 'insensitive' } },
      orderBy: { timestamp: 'desc' },
    });

    log.info(`[${requestId}] sendemail.ts Last email sent at:, ${lasttime?.timestamp}`, {
      action: 'fetch_last_email_log',
      timestamp: new Date().toISOString(),
    });
    console.log(`🚀 [${requestId}] sendemail.ts Last email sent at:`, lasttime?.timestamp);
    console.log(`🚀 [${requestId}] sendemail.ts Last email message:`, lasttime?.message);
  } catch (err) {
    console.error(`❌ ${requestId} [sendemail.ts] Error caught:`, err);
  }

  try {
    console.log(`🚀 [${requestId}] sendemail.ts Starting logic`);
    await log.info(`sendemail.ts module accessed`, {
      action: 'fetch',
      timestamp: new Date().toISOString(),
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
  log.info(`[${requestId}] sendemail.ts logEvent called`, {
    action: 'sendemail logEvent',
    timestamp: new Date().toISOString(),
  });
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
  subject?: string | number | Record<string, unknown>,
  message?: string | number | Record<string, unknown>
) {
  const recipients = [new Recipient(toEmail, toName)];

  let finalSubject: string;
  if (typeof subject === 'string') {
    finalSubject = subject;
  } else if (typeof subject === 'number') {
    finalSubject = subject.toString();
  } else if (subject && typeof subject === 'object') {
    // If it's an object, try to extract a meaningful subject
    finalSubject = `Weather Forecast - ${new Date().toLocaleDateString()}`;
  } else {
    finalSubject = `Mail Success Confirmation - ${toName}`;
  }

  console.log(`[sendemail] sendEmailDirect triggered for ${toEmail} with requestId: ${requestId}`);
  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(finalSubject)
    .setText(`Sent from utils ${toName} app`)
    .setHtml(
      `<strong>Sent from utils ${toName} app ${String(message ?? '')}</strong> ${requestId}`
    );

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

  console.log('ℹ️ Email skipped:', result.reason || 'throttled');
  return false;
}
// Avoid top-level side effects during build/runtime module evaluation
// Call logSendEmailModuleAccess() explicitly from a safe place if needed
