import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock uuid.v7 to return a deterministic value
vi.mock('uuid', () => ({ v7: () => 'fixed-uuid-123' }));

// Mock NextResponse.next to return an object shaped like the real response
vi.mock('next/server', () => {
  return {
    NextResponse: {
      next: ({ request }: any) => {
        return {
          request,
          headers: new Headers(),
        };
      },
    },
  };
});

import { generateUUID, uuidj } from '../uuidj';

describe('uuidj utilities', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('generateUUID returns the mocked uuid', () => {
    expect(generateUUID()).toBe('fixed-uuid-123');
  });

  it('uuidj sets x-request-id on response and cloned request headers', () => {
    const req = { headers: new Headers() } as any;
    req.headers.set('x-request-id', 'old');

    const res = uuidj(req);

    const anyRes = res as any;
    expect(anyRes.headers.get('x-request-id')).toBe('fixed-uuid-123');
    expect(anyRes.request.headers.get('x-request-id')).toBe('fixed-uuid-123');
  });

  it('uuidj sets header when none existed before', () => {
    const req = { headers: new Headers() } as any;
    const res = uuidj(req);
    const anyRes = res as any;
    expect(anyRes.headers.get('x-request-id')).toBe('fixed-uuid-123');
  });
});
