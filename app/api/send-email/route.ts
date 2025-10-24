//import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
// db is intentionally not used here; sendWithDedup handles logging
import { sendWithDedup } from '@/app/lib/sendWithDedup';
import { z } from 'zod';
import { env } from 'process';
console.log('[build] Generating /api/send-email');
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // or 'https://www.kraus.my.id'
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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

    console.log('📧 [send-email] Subject:', subject);

    const sendFn = async () => {
      await mailerSend.email.send(emailParams);
    };

    const result = await sendWithDedup({
      source: 'sendemail',
      message: `Email with subject ${subject}`,
      requestId,
      throttleMinutes: env.EMAIL_THROTTLE_MINUTES,
      sendFn,
    });

    if (result.sent) {
      return new Response(JSON.stringify({ status: 'success', message: 'Email sent', requestId: requestId || 'none' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    return new Response(JSON.stringify({ status: 'skipped', reason: result.reason || 'throttled', requestId: requestId || 'none' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error(`[send-email] ❌ Error sending email`, err);

    return new Response(JSON.stringify({
  status: 'error',
  message: 'Internal server error',
  requestId: 'none',
}), {
  status: 500,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

  }
}
