import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { db } from '../lib/db';
import { sendWithDedup } from '@/app/lib/sendWithDedup';
import { generateUUID } from '@/uuidj';
import { createLogger } from './logger';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!,
});
const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');
export default async function logSendEmailModuleAccess(requestId?: string) {
  const finalRequestId = requestId || generateUUID();
  const log = createLogger('app/utils/sendemail.ts', finalRequestId);

  try {
    const lasttime = await db.log.findFirst({
      where: { message: { contains: 'email sent', mode: 'insensitive' } },
      orderBy: { timestamp: 'desc' },
    });

    await log.info('Last email log retrieved', {
      lastEmailTime: lasttime?.timestamp?.toISOString(),
      lastEmailMessage: lasttime?.message,
    });
  } catch (err) {
    await log.error('Error fetching last email log', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  try {
    await log.info('sendemail.ts module accessed');
  } catch (err) {
    // Fallback if logging fails
    console.warn('[sendemail] Failed to log module access:', err);
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
  const requestId = payload.requestId || generateUUID();
  const log = createLogger('app/utils/sendemail.ts', requestId);

  try {
    await logSendEmailModuleAccess(requestId);
    await log.info('Log event processed', {
      severity: payload.severity,
      source: payload.source,
    });
  } catch (err) {
    await log
      .error('Log event failed', {
        error: err instanceof Error ? err.message : String(err),
      })
      .catch(() => {
        // Fallback if logging fails
        console.warn('[sendemail] Failed to log event:', err);
      });
  }
}

export async function sendEmailDirect(
  toEmail: string,
  toName: string,
  requestId?: string,
  subject?: string | number | Record<string, unknown>,
  message?: string | number | Record<string, unknown>
) {
  const finalRequestId = requestId || generateUUID();
  const log = createLogger('app/utils/sendemail.ts', finalRequestId);
  const recipients = [new Recipient(toEmail, toName)];

  let finalSubject: string;
  if (typeof subject === 'string') {
    finalSubject = subject;
  } else if (typeof subject === 'number') {
    finalSubject = subject.toString();
  } else if (subject && typeof subject === 'object') {
    finalSubject = `Weather Forecast - ${new Date().toLocaleDateString()}`;
  } else {
    finalSubject = `Mail Success Confirmation - ${toName}`;
  }

  await log.info('Sending email', {
    recipient: toEmail,
    subject: finalSubject,
  });
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
    requestId: finalRequestId,
    throttleMinutes: process.env.EMAIL_THROTTLE_MINUTES ? 15 : 0,
    sendFn,
  });

  if (result.sent) {
    await log.info('Email sent successfully', {
      recipient: toEmail,
      recipientName: toName,
      subject: finalSubject,
    });
    return true;
  }

  await log.info('Email skipped', {
    reason: result.reason || 'throttled',
    recipient: toEmail,
  });
  return false;
}
