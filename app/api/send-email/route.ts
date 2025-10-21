//import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { db } from './../../lib/db';
import { z } from 'zod';
console.log('[build] Generating /api/send-email');
// Initialize MailerSend outside the handler for better performance
// NOTE: Always use process.env.VAR directly here, or set the key
// in the MailerSend constructor. Next.js automatically handles envs.
const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY! });
const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');

// Define the expected structure of the incoming request body
// interface EmailRequest {
//   toEmail: string;
//   toName: string;
//   subject: string
//   requestId?: string;
// }
console.log('📥 [API] Received email request');
const EmailSchema = z.object({
  toEmail: z.string().email(),
  toName: z.string(),
  subject: z.string(),
  message: z.string().optional(),
  requestId: z.string().optional(),
});
// Route Handlers use standard Web API Request/Response objects
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = EmailSchema.safeParse(body);

    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error.format());
      return new Response('Invalid payload', { status: 400 });
    }

    const { toEmail, toName, subject, message = '', requestId } = parsed.data;
        // Proceed with sending email
    console.log('📨 Sending email to:', toEmail);
    // await mailerSend.email.send(...)
    const recipients = [new Recipient(toEmail, toName)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setText(`Sent from API to ${toName} app message: ${message || ''}  ${requestId || ''}`)
      .setHtml(`<strong>Sent from API to ${toName} app</strong> ${requestId}`);
console.log('📧 Subject:', subject);

    await mailerSend.email.send(emailParams)
        const severity = 'info';
    const source = 'sendemail';
    
    const metadata = { action: 'email', timestamp: new Date().toISOString() };
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
    return new Response(JSON.stringify({
  status: 'success',
  message: 'Email sent',
  requestId: requestId || 'none',
}), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});


  } catch (err) {
    console.error('❌ API error:', err);
    return new Response('Internal error', { status: 500 });
  }
}
