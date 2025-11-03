import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { logInfoFactory } from '@/app/utils/logger';
const logInfo = logInfoFactory('app/api/entry/unpublish/route.ts');

export async function POST(req: Request) {
  const cookieStore = await cookies();
  console.log('[entry/unpublish] All cookies:');
  for (const [name, cookie] of cookieStore.getAll().entries()) {
    console.log(`- ${name}: ${cookie.value}`);
  }

  const username = cookieStore.get('username')?.value;
  console.log(`[entry/unpublish] Unpublish request received ${username}`);

  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
  }
  //const username = cookieStore.get('username')?.value;
  console.log(`[entry/unpublish] Unpublish request received ${username}`);
  if (!username) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  //const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 });
  }

  async function GET(req: Request) {
    const requestId = req.headers.get('x-request-id') ?? undefined;

    await db.post.update({
      where: { id: Number(id) },
      data: { published: false },
    });

    await logInfo(`Entry ${id} marked as unpublished`, { user: username, entryId: id }, requestId);

    return NextResponse.json({ success: true });
  }
}
