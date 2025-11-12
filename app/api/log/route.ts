import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { severity = 'info', source, message = '', requestId, metadata } = body;

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    // Fallback to console since this is the logging endpoint
    console.warn('[log] Insert failed:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
