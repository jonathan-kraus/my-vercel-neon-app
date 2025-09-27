import 'dotenv/config';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY!, // use env variable
});

const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');

export async function sendConfirmationEmail(toEmail: string, toName: string) {
  const recipients = [new Recipient(toEmail, toName)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject('Mail Success')
    .setHtml(`<strong>Sent from utils ${toEmail} app</strong>`)
    .setText(`Sent from utils ${toEmail} app`);

  await mailerSend.email.send(emailParams);
  console.log('✅ Email from utils sent successfully to:', toEmail);
}
