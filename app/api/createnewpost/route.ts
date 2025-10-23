
import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';
import { logEvent } from '@/app/lib/log';
import { sendConfirmationEmail } from '@/app/utils/sendemail';
console.log('[build] Generating /createnewpost');

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const formData = await req.formData();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const authorName = formData.get('authorName') as string;

  try {
    const user = await db.user.findFirst({
      where: { name: { equals: authorName, mode: 'insensitive' } },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.post.create({
      data: {
        title,
        content,
        published: true,
        createdAt: new Date(),
        authorId: user.id, // ✅ This must match a real User.id
      },
    });

    await sendConfirmationEmail(user.email, user.name || 'Jonathan', requestId, 'Create new post');

    await logEvent({
  source: 'createNewPost route',
  message: `Post created with title: ${title}`,
  requestId,
  metadata: { userAction: 'create' },
});
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Create post error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
