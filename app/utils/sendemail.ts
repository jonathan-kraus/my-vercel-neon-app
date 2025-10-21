import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { db } from '../lib/db';
console.log('📦 sendemail.ts loaded');
console.log('[sendemail] VERCEL_URL:', process.env.VERCEL_URL);
console.log('[sendemail] SITE_URL:', process.env.SITE_URL);
console.log('[sendemail] NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
});

const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');
export default async function logSendEmailModuleAccess() {
const severity = 'info';
const source = 'sendemail.ts';
const message = `sendemail.ts module accessed`;
const requestId = crypto.randomUUID();
const metadata = { action: 'fetch', timestamp: new Date().toISOString() };
try {
  console.log('🚀 Starting logic');
    await db.log.create({
      data: {
        severity,
        source,
        message,
        requestId,
        metadata: metadata ?? {},
        timestamp: new Date(),
      },
    })  
  } catch (err) {
    console.error(`❌ ${requestId} [sendemail.ts] Error caught:`, err);
  }}
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
    'https://kraus.my.id';

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

export async function sendConfirmationEmail(toEmail: string, toName: string, requestId?: string) {
  const recipients = [new Recipient(toEmail, toName)];

console.log(`[email-client] sendConfirmationEmail triggered for ${toEmail} with requestId: ${requestId}`);    
  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Mail Success')
    .setText(`Sent from utils ${toName} app`)
    .setHtml(`<strong>Sent from utils ${toName} app</strong> ${requestId}`);

  await mailerSend.email.send(emailParams);
  console.log('✅ Email from utils sent successfully to:', toEmail, toName);
  console.log('✅ Email from utils sent successfully to:', emailParams);

  // ✅ Call logger here
  await logEvent({
    severity: 'info',
    source: 'sendemail',
    message: `Email sent to ${toEmail}`,
    requestId,
    metadata: { action: 'email', timestamp: new Date().toISOString() },
  });

  return true;

} logSendEmailModuleAccess();
