// app/api/checkUser/route.ts
import { db } from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { name } = await req.json();

  const user = await db.user.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  });

  return NextResponse.json({ exists: !!user });
}
