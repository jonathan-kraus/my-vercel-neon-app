import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { logEvent } from '../lib/log';
console.log('📦 sendemail.ts loaded');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!, // use env variable
});

const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');

export async function sendConfirmationEmail(toEmail: string, toName: string, requestId?: string) {
  const recipients = [new Recipient(toEmail, toName)];

  const logEvent = async () => {
    try {
      await fetch('https://kraus.my.id/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'info',
          source: '[sendEmail]',
          message: `sending email to <${toEmail}>`,
          requestId: requestId, // or generate dynamically
          metadata: { userAction: 'send_email' },
        }),
      });
  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Mail Success')
    .setText(`Sent from utils ${toName} app`)
    .setHtml(`<strong>Sent from utils ${toName} app</strong> ${requestId}`);


  await mailerSend.email.send(emailParams);
  console.log('✅ Email from utils sent successfully to:', toEmail, toName);
  //console.log('✅ Email purposely not sent:', mailerSend, emailParams, toEmail, toName);
}
