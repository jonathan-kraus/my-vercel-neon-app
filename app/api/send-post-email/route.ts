import { NextRequest, NextResponse } from 'next/server';
import { sendNewPostEmail } from '../../utils/email';

export async function POST(request: NextRequest) {
  const { title, content, to } = await request.json();
  if (process.env.EMAIL_ENABLED === 'false') {
    return NextResponse.json({ success: true, emailSent: false });
  }
  await sendNewPostEmail({ title, content, to });
  return NextResponse.json({ success: true, emailSent: true });
}
