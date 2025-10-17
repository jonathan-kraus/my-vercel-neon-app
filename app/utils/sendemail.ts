import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

console.log('📦 sendemail.ts loaded');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!, // use env variable
});

const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');

export async function sendConfirmationEmail(toEmail: string, toName: string, requestId?: string) {
  const recipients = [new Recipient(toEmail, toName)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Mail Success')
    .setText(`Sent from utils ${toName} app`)
    .setHtml(`<strong>Sent from utils ${toName} app</strong> ${requestId}`);
console.log('✅ [sendemail] start logging to:', requestId);
    const severity = 'info';
    const source = 'sendemail';
    const message = `sending email ${requestId}`;
    const metadata = { action: 'email', timestamp: new Date().toISOString() };
    if (requestId) {
      await fetch(`${baseUrl}/api/log`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ severity, source, message, requestId, metadata }),
});
      console.log('✅ [sendemail] Log sent successfully to:', toEmail, toName);

    }
  await mailerSend.email.send(emailParams);
  console.log('✅ Email from utils sent successfully to:', toEmail, toName);
  console.log('✅ Email from utils sent successfully to:', emailParams);
  //console.log('✅ Email purposely not sent:', mailerSend, emailParams, toEmail, toName);
  return true;
}
