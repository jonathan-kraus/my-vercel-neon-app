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
    const currentQueries: any[] = []; // Empty current queries
    const rows = [{ query: 'select 1', calls: 10, total_time: 1000, mean_time: 100 }];
    // @ts-ignore
    db.$queryRaw.mockResolvedValueOnce(currentQueries); // First call: current queries
    // @ts-ignore
    db.$queryRaw.mockResolvedValueOnce(rows); // Second call: pg_stat_statements

    const req: any = { headers: new Headers() };
    const res: any = await GET(req);

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('pg_stat_statements');
    expect(res.body.queries).toHaveLength(1);
    expect(res.body.queries[0]).toHaveProperty('explainQuery');
  });

  it('falls back to pg_stat_activity when pg_stat_statements fails', async () => {
    const currentQueries: any[] = []; // Empty current queries
    const fallbackRows = [{ pid: 123, duration_ms: 5000, state: 'active', query: 'long query' }];
    // First call: current queries (succeeds)
    // @ts-ignore
    db.$queryRaw.mockResolvedValueOnce(currentQueries);
    // Second call: pg_stat_statements (throws)
    // @ts-ignore
    db.$queryRaw.mockRejectedValueOnce(new Error('no extension'));
    // Third call: pg_stat_activity (resolves)
    // @ts-ignore
    db.$queryRaw.mockResolvedValueOnce(fallbackRows);

    const req: any = { headers: new Headers() };
    const res: any = await GET(req);

    expect(res.status).toBe(200);
    expect(res.body.source).toBe('pg_stat_activity');
    expect(res.body.queries[0]).toHaveProperty('pid');
  });

  it('returns 500 when both queries fail', async () => {
    // First call: current queries (throws)
    // @ts-ignore
    db.$queryRaw.mockRejectedValueOnce(new Error('db down'));
    // Second call: pg_stat_statements (throws)
    // @ts-ignore
    db.$queryRaw.mockRejectedValueOnce(new Error('db down'));
    // Third call: pg_stat_activity (throws)
    // @ts-ignore
    db.$queryRaw.mockRejectedValueOnce(new Error('db down'));

    const req: any = { headers: new Headers() };
    const res: any = await GET(req);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
