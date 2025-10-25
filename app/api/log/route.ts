import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
console.log('[build] Generating /log');
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // or your domain
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
export async function POST(req: Request) {
  const body = await req.json();

  const { severity = 'info', source, message = '', requestId, metadata } = body;
  console.log(`[log] [${requestId}] Received log event:`, { severity, source, message, metadata });
  try {
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

    console.log(`[log] [${requestId}] Log event inserted successfully`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // or your domain
      },
    });
  } catch (error) {
    console.error('Log insert failed:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
