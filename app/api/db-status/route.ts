// app/api/db-status/route.ts
import { NextResponse } from 'next/server';
import { getDbStatus } from '@/app/utils/getDbStatus';
import { generateUUID } from '@/uuidj';

export async function GET() {
  try {
    const requestId = generateUUID();
    const status = await getDbStatus(requestId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching database status:', error);
    return NextResponse.json({ error: 'Failed to fetch database status' }, { status: 500 });
  }
}
