// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v7 as uuidv7 } from 'uuid';

export function middleware(req: NextRequest) {
  const requestId = uuidv7();

  // Clone the request and add the header
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-request-id', requestId);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Also echo it back in the response headers (useful for debugging/tracing)
  res.headers.set('x-request-id', requestId);

  return res;
}
