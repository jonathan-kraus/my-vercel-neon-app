// app/api/send-email/route.ts
import { sendConfirmationEmail } from '@/app/lib/sendconfirmationemail';
import { NextResponse } from 'next/server';
try {
    export async function POST(req: Request) {
  const { toEmail, toName, requestId } = await req.json();
  await sendConfirmationEmail(toEmail, toName, requestId);
  return NextResponse.json({ message: 'Email sent' }, { status: 200 });
}} catch (error) {
  return NextResponse.json({ error: 'internal_server_error' }, { status: 500 });  
}}