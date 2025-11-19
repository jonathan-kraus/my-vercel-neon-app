import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the db module before importing route handlers. Use a hoisted factory so
// Vitest can properly replace the module at load time.
vi.mock('@/app/lib/db', () => {
  return {
    db: {
      $queryRaw: vi.fn(),
      $queryRawUnsafe: vi.fn(),
      log: {
        create: vi.fn(async (_: any) => ({})),
      },
    },
  };
});

import { GET as metadataGET } from '@/app/api/neon/metadata/route';
import { GET as limitsGET } from '@/app/api/neon/limits/route';
import { GET as healthGET } from '@/app/api/neon/health/route';
import { GET as slowGET } from '@/app/api/neon/slow-queries/route';
import { POST as explainPOST } from '@/app/api/neon/explain/route';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // cleanup env modifications
  delete process.env.DATABASE_URL;
});

describe('Neon API routes', () => {
  it('metadata returns parsed DATABASE_URL info', async () => {
    process.env.DATABASE_URL = 'postgres://alice:pw@branch1.project.region.neon.tech:5432/mydb';
    const req = new Request('http://localhost/api/neon/metadata');
    const res = await metadataGET(req as any);
    const data = await res.json();
    expect(data).toHaveProperty('host');
    expect(data.host).toContain('neon.tech');
    expect(data.branch).toBe('branch1');
    expect(data.database).toBe('mydb');
  });

  it('limits returns max/active/total connections and utilization', async () => {
    // Prepare sequential returns: first for pg_settings, second for pg_stat_activity
    const { db } = await import('@/app/lib/db');
    db.$queryRaw.mockImplementationOnce(async () => [{ setting: '120' }]);
    db.$queryRaw.mockImplementationOnce(async () => [{ active: 6, total: 8 }]);

    const req = new Request('http://localhost/api/neon/limits');
    const res = await limitsGET(req as any);
    const data = await res.json();
    expect(data.maxConnections).toBe(120);
    expect(data.activeConnections).toBe(6);
    expect(data.totalConnections).toBe(8);
    expect(data.utilization).toBe(Math.round((6 / 120) * 100));
  });

  it('health returns ok and latencyMs', async () => {
    const { db } = await import('@/app/lib/db');
    db.$queryRaw.mockImplementationOnce(async () => [1]);
    const req = new Request('http://localhost/api/neon/health');
    const res = await healthGET(req as any);
    const data = await res.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
    expect(data).toHaveProperty('latencyMs');
  });

  it('slow-queries returns pg_stat_statements results when available', async () => {
    const stmtRows = [{ query: 'SELECT 1', calls: 10, total_time: 100, mean_time: 10 }];
    const { db } = await import('@/app/lib/db');
    db.$queryRaw.mockImplementationOnce(async () => stmtRows);
    const req = new Request('http://localhost/api/neon/slow-queries');
    const res = await slowGET(req as any);
    const data = await res.json();
    expect(data).toHaveProperty('source', 'pg_stat_statements');
    expect(data.queries.length).toBeGreaterThan(0);
  });

  it('explain rejects non-SELECT queries', async () => {
    const body = { query: 'DELETE FROM users' };
    const req = new Request('http://localhost/api/neon/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res = await explainPOST(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toHaveProperty('error');
  });

  it('explain returns plan for SELECT queries', async () => {
    // mock $queryRawUnsafe to return rows that include plan text
    const { db } = await import('@/app/lib/db');
    db.$queryRawUnsafe.mockImplementationOnce(async () => [
      { plan: 'Plan line 1' },
      { plan: 'Plan line 2' },
    ]);

    const body = { query: 'SELECT * FROM posts LIMIT 1' };
    const req = new Request('http://localhost/api/neon/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await explainPOST(req as any);
    const data = await res.json();
    expect(data).toHaveProperty('plan');
    expect(Array.isArray(data.plan)).toBe(true);
    expect(data.plan.length).toBeGreaterThan(0);
  });
});
