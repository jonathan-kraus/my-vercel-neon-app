import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/app/lib/db', () => ({
  db: {
    $queryRawUnsafe: vi.fn(),
  },
}));

const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
vi.mock('@/app/utils/logger', () => ({
  createLogger: vi.fn(() => loggerMock),
}));

vi.mock('@/uuidj', () => ({ generateUUID: () => 'fixed-uuid' }));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({ body, status: opts?.status ?? 200 }),
  },
}));

import { POST } from '@/app/api/neon/explain/route';
import { db } from '@/app/lib/db';
import { createLogger } from '@/app/utils/logger';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('neon explain route', () => {
  it('returns 400 for empty query', async () => {
    const req: any = { headers: new Headers(), json: async () => ({}) };

    const res: any = await POST(req);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    // logger.error should have been called for missing query
    expect(createLogger('test')).toBeDefined();
    expect(createLogger('test')).toHaveProperty('error');
  });

  it('rejects non-SELECT queries with 400', async () => {
    const req: any = { headers: new Headers(), json: async () => ({ query: 'DROP TABLE users' }) };

    const res: any = await POST(req);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(createLogger('test')).toBeDefined();
    expect(createLogger('test').warn).toHaveBeenCalled();
  });

  it('runs EXPLAIN for SELECT and returns plan lines', async () => {
    // mock rows as returned by EXPLAIN
    // @ts-ignore
    db.$queryRawUnsafe.mockResolvedValueOnce([{ line: 'PLAN 1' }, { line: 'PLAN 2' }]);

    const req: any = { headers: new Headers(), json: async () => ({ query: 'SELECT 1' }) };

    const res: any = await POST(req);

    expect(db.$queryRawUnsafe).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('plan');
    expect(res.body.plan).toEqual(['PLAN 1', 'PLAN 2']);
    expect(createLogger('test').info).toHaveBeenCalled();
  });

  it('returns 500 when DB throws', async () => {
    // @ts-ignore
    db.$queryRawUnsafe.mockRejectedValueOnce(new Error('boom'));

    const req: any = { headers: new Headers(), json: async () => ({ query: 'SELECT 1' }) };

    const res: any = await POST(req);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
