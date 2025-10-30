import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

// Flatten nested metadata into key-value strings
function flattenMetadata(meta: unknown): Record<string, string> {
  const result: Record<string, string> = {};

  function recurse(obj: any, prefix = '') {
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        recurse(obj[key], `${prefix}${key}.`);
      }
    } else {
      result[prefix.slice(0, -1)] = String(obj);
    }
  }

  recurse(meta);
  return result;
}

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

  // Guard against missing required fields
  if (!source || !message) {
    return NextResponse.json(
      { status: 'error', error: 'Missing source or message' },
      { status: 400 }
    );
  }

  // Optional: skip logging during build/dev
  if (process.env.VERCEL_ENV === 'development') {
    console.log('[log] Skipping log insert during build/dev');
    return NextResponse.json({ success: true });
  }

  // Flatten metadata
  const normalizedMetadata = flattenMetadata(metadata ?? {});

  // Optional: enrich with request context
  const headers = Object.fromEntries(req.headers.entries());
  const userAgent = headers['user-agent'] ?? '';
  const ip = headers['x-forwarded-for'] ?? req.headers.get('host') ?? '';

  normalizedMetadata['request.ip'] = ip;
  normalizedMetadata['request.userAgent'] = userAgent;

  console.log(`[log] [${requestId}] Received log event:`, {
    severity,
    source,
    message,
    metadata: normalizedMetadata,
  });

  try {
    await db.log.create({
      data: {
        severity,
        source,
        message,
        requestId,
        metadata: normalizedMetadata,
        timestamp: new Date(),
      },
    });

    // Optional: stream to external service
    // await logtail.info(message, {
    //   severity,
    //   source,
    //   requestId,
    //   ...normalizedMetadata,
    // });

    console.log(`[log] [${requestId}] Log event inserted successfully`);
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Log insert failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
