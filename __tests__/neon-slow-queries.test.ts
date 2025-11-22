import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/app/lib/db', () => ({
  db: {
    $queryRaw: vi.fn(),
    slowQueryHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

vi.mock('@/app/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/uuidj', () => ({ generateUUID: () => 'fixed-uuid' }));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({ body, status: opts?.status ?? 200 }),
  },
}));

import { GET } from '@/app/api/neon/slow-queries/route';
import { db } from '@/app/lib/db';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('neon slow-queries route', () => {
  it('returns pg_stat_statements results when available', async () => {
    const rows = [{ query: 'select 1', calls: 10, total_time: 1000, mean_time: 100 }];
    // @ts-ignore
    db.$queryRaw.mockResolvedValueOnce(rows);

    const req: any = { headers: new Headers() };
    const res: any = await GET(req);

    // Now also logs history, so we don't check exact call count for $queryRaw
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('pg_stat_statements');
    expect(res.body.queries).toHaveLength(1);
  });

  it('falls back to pg_stat_activity when pg_stat_statements fails', async () => {
    const fallbackRows = [{ pid: 123, duration_ms: 5000, state: 'active', query: 'long query' }];
    // first call throws
    // @ts-ignore
    db.$queryRaw.mockRejectedValueOnce(new Error('no extension'));
    // second call resolves
    // @ts-ignore
    db.$queryRaw.mockResolvedValueOnce(fallbackRows);

    const req: any = { headers: new Headers() };
    const res: any = await GET(req);

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('pg_stat_activity');
    expect(res.body.queries[0]).toHaveProperty('pid');
  });

  it('returns 500 when both queries fail', async () => {
    // both calls throw
    // @ts-ignore
    db.$queryRaw.mockRejectedValue(new Error('db down'));

    const req: any = { headers: new Headers() };
    const res: any = await GET(req);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
