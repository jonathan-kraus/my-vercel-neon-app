// app/api/deletepost/route.ts
import { db } from '@/app/lib/db';
import { logEvent } from '@/app/lib/log';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const id = Number(formData.get('id'));
    const requestId = crypto.randomUUID();
    await logEvent({
  source: 'deletepost route',
  message: `post ${id} deleted`,
  requestId,
  metadata: { userAction: 'delete' },
});
    if (!id || isNaN(id)) {
      return new Response('Invalid post ID', { status: 400 });
    }

    // Optional: mock session check
    const session = 1;
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    await db.post.delete({
      where: { id },
    });

    return new Response(null, {
      status: 302,
      headers: { Location: '/pstbyusr' }, // ✅ redirect after delete
    });
  } catch (err) {
    console.error('[DeletePost] Error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
