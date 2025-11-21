import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules used by the route
vi.mock('@/app/lib/db', () => ({
  db: {
    log: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $queryRawUnsafe: vi.fn(),
  },
}));

vi.mock('@/app/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/uuidj', () => ({ generateUUID: () => 'fixed-uuid' }));

vi.mock('@/app/utils/featureFlags', () => ({ isFeatureEnabled: vi.fn().mockResolvedValue(false) }));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, opts?: any) => ({ body, status: opts?.status ?? 200 }),
  },
}));

import { GET } from '@/app/api/logs/search/route';
import { db } from '@/app/lib/db';
import { isFeatureEnabled } from '@/app/utils/featureFlags';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('logs search route', () => {
  it('returns logs via db.log.findMany when no metadata param', async () => {
    // @ts-ignore
    db.log.findMany.mockResolvedValue([{ id: 1 }]);
    // @ts-ignore
    db.log.count.mockResolvedValue(1);

    const req: any = {
      url: 'http://localhost/api/logs/search?page=2&pageSize=10&severity=error&source=svc&message=hello&requestId=req123&from=2025-01-01&to=2025-12-31',
      headers: new Headers(),
    };

    const res: any = await GET(req);

    expect(db.log.findMany).toHaveBeenCalled();
    expect(db.log.count).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body.page).toBe(2);
    expect(res.body.pageSize).toBe(10);
  });

  it('uses raw SQL path when metadata param present', async () => {
    // @ts-ignore
    db.$queryRawUnsafe.mockResolvedValueOnce([{ id: 2 }]);
    // count query returns array with { count: bigint }
    // @ts-ignore
    db.$queryRawUnsafe.mockResolvedValueOnce([{ count: BigInt(3) }]);

    const req: any = {
      url: 'http://localhost/api/logs/search?metadata=meta&message=hi',
      headers: new Headers(),
    };

    const res: any = await GET(req);

    expect(db.$queryRawUnsafe).toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('returns 500 when db throws', async () => {
    // @ts-ignore
    db.log.findMany.mockRejectedValue(new Error('boom'));

    const req: any = { url: 'http://localhost/api/logs/search', headers: new Headers() };

    const res: any = await GET(req);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });

  it('calls verbose logging when feature flag enabled', async () => {
    // enable verbose logging
    // @ts-ignore
    isFeatureEnabled.mockResolvedValueOnce(true);
    // @ts-ignore
    db.log.findMany.mockResolvedValue([]);
    // @ts-ignore
    db.log.count.mockResolvedValue(0);

    const req: any = { url: 'http://localhost/api/logs/search', headers: new Headers() };

    const res: any = await GET(req);

    expect(isFeatureEnabled).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
