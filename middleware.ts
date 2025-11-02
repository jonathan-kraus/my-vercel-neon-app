// middleware.ts (at project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v7 as uuidv7 } from 'uuid';

export function middleware(req: NextRequest) {
  // eslint-disable-line @typescript-eslint/no-unused-vars
  const requestId = uuidv7();

  // Clone the response so we can attach headers
  const res = NextResponse.next();

  // Add the requestId as a header so routes can read it
  res.headers.set('x-request-id', requestId);

  return res;
}
