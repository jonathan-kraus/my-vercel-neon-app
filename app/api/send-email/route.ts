//import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
// db is intentionally not used here; sendWithDedup handles logging
import { sendWithDedup } from '@/app/lib/sendWithDedup';
import { z } from 'zod';
import { generateUUID } from '../../../uuidj';
import { createLogger } from '@/app/utils/logger';

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
//   subject: z.string()
//   requestId?: string;
// }

const EmailSchema = z.object({
  toEmail: z.email(),
  toName: z.string(),
  subject: z.string(),
  message: z.string().optional(),
  requestId: z.string().optional(),
  metadata: z.string().optional(),
});
// Route Handlers use standard Web API Request/Response objects
export async function POST(request: Request) {
  const requestId = generateUUID();
  const log = createLogger('app/api/send-email/route.ts');

  try {
    const body = await request.json();
    const parsed = EmailSchema.safeParse(body);
    log.info('Received send-email request', { requestBody: body });
    if (!parsed.success) {
      await log.error('Validation failed', { errors: parsed.error.format() });
      return new Response('Invalid payload', { status: 400 });
    }

    const { toEmail, toName, subject, message = '', requestId: providedRequestId } = parsed.data;
    const finalRequestId = providedRequestId || requestId;
    // Format message for HTML (convert newlines to <br>)
    const htmlMessage = message.replace(/\n/g, '<br>');
    const metadata = parsed.data.metadata;
    const emailMetadata = parsed.data.metadata;
    log.info('Preparing to send email', { metadata, emailj: emailMetadata });
    // Proceed with sending email
    const recipients = [new Recipient(toEmail, toName)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject(subject)
      .setText(`Sent from API to ${toName} app message: ${message || ''}  ${requestId || ''}`)
      .setHtml(
        `<strong>Sent from API to ${toName} app message:</strong><br>${htmlMessage} ${requestId}`
      );

    const sendFn = async () => {
      await mailerSend.email.send(emailParams);
    };

    const result = await sendWithDedup({
      source: 'sendemail',
      message: `Email with subject ${subject}`,
      requestId: finalRequestId,
      sendFn,
    });

    if (result.sent) {
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'Email sent',
          requestId: finalRequestId,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'skipped',
        reason: result.reason || 'throttled',
        requestId: finalRequestId,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err) {
    await log.error('Error sending email', { error: String(err) });

    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Internal server error',
        requestId,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
