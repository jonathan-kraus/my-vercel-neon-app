import { NextResponse } from 'next/server';
import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { db } from './../../lib/db';
// Initialize MailerSend outside the handler for better performance
// NOTE: Always use process.env.VAR directly here, or set the key
// in the MailerSend constructor. Next.js automatically handles envs.
const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY! });
const sentFrom = new Sender('Jonathan@kraus.my.id', 'Jonathan');

// Define the expected structure of the incoming request body
interface EmailRequest {
  toEmail: string;
  toName: string;
  requestId?: string;
}

// Route Handlers use standard Web API Request/Response objects
export async function POST(request: Request) {
  const { toEmail, toName, requestId }: EmailRequest = await request.json();

  if (!toEmail || !toName) {
    return NextResponse.json(
      { message: 'Missing required parameters: toEmail or toName' },
      { status: 400 }
    );
  }

  try {
    const recipients = [new Recipient(toEmail, toName)];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject('Mail Success')
      .setText(`Sent from API to ${toName} app`)
      .setHtml(`<strong>Sent from API to ${toName} app</strong> ${requestId}`);

    await mailerSend.email.send(emailParams);
    
    // --- Database Logging (Server-Side) ---
    const severity = 'info';
    const source = 'sendemail';
    const message = `Email sent to ${toEmail}`;
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

    console.log('✅ Email sent successfully via API to:', toEmail, toName);

    return NextResponse.json(
      { success: true, message: 'Email scheduled for delivery' },
      { status: 200 }
    );

  } catch (error) {
    console.error(`❌ [send-email/route.ts] Error sending email or logging:`, error);
    // Return a 500 response, but don't expose sensitive error details
    return NextResponse.json(
      { success: false, message: 'Failed to send email' },
      { status: 500 }
    );
  }
}