import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { asyncLocalStorage } from '@/app/utils/requestContext';
vi.mock('@/app/lib/db', () => ({
  db: {
    log: {
      create: vi.fn(),
    },
  },
}));

import { logger, createLogger } from '@/app/utils/logger';
import { db } from '@/app/lib/db';

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetAllMocks();
  process.env = { ...OLD_ENV };
  // ensure no window by default
  // @ts-ignore
  delete global.window;
  // @ts-ignore
  delete global.navigator;
  // @ts-ignore
  delete global.fetch;
});

afterEach(() => {
  process.env = OLD_ENV;
});

describe('logger utils', () => {
  it('writes to DB on server-side', async () => {
    // server-side: typeof window === 'undefined'
    await logger({ severity: 'info', source: 'test', message: 'hello' });
    // @ts-ignore
    expect(db.log.create).toHaveBeenCalled();
    // check payload shape
    // @ts-ignore
    const callArg = db.log.create.mock.calls[0][0];
    expect(callArg).toHaveProperty('data');
    expect(callArg.data).toMatchObject({ severity: 'info', source: 'test', message: 'hello' });
    expect(callArg.data).toHaveProperty('metadata');
    expect(callArg.data.metadata).toHaveProperty('timestamp');
  });

  it('createLogger helpers call logger and write correct severity', async () => {
    await asyncLocalStorage.run({ requestId: 'rid-123' }, async () => {
      const l = createLogger('src');
      await l.warn('warn me', { a: 1 });
      // @ts-ignore
      expect(db.log.create).toHaveBeenCalled();
      // @ts-ignore
      const callArg = db.log.create.mock.calls[0][0].data;
      expect(callArg.severity).toBe('warning');
      expect(callArg.requestId).toBe('rid-123');
      expect(callArg.metadata).toMatchObject({ a: 1 });
    });
  });

  it('forwards to API on client-side (development)', async () => {
    await asyncLocalStorage.run({ requestId: 'rid-123' }, async () => {
      // @ts-ignore
      global.window = { location: { pathname: '/x', origin: 'https://app' } };
      // @ts-ignore
      global.navigator = { userAgent: 'vitest' };
      (process.env as any).NODE_ENV = 'development';

      // @ts-ignore
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      await logger({ severity: 'info', source: 'client', message: 'hi' });

      // @ts-ignore
      expect(global.fetch).toHaveBeenCalled();
      // @ts-ignore
      const [url, opts] = global.fetch.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/log');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body).toHaveProperty('severity', 'info');
      expect(body.metadata).toHaveProperty('userAgent');
    });
  });

  it('forwards to Vercel URL in production when VERCEL_URL set', async () => {
    // simulate client
    // @ts-ignore
    global.window = { location: { pathname: '/x', origin: 'https://app' } };
    // @ts-ignore
    global.navigator = { userAgent: 'vitest' };
    (process.env as any).NODE_ENV = 'production';
    (process.env as any).VERCEL_URL = 'myapp.vercel.app';

    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await logger({ severity: 'error', source: 'client', message: 'boom' });

    // @ts-ignore
    expect(global.fetch).toHaveBeenCalled();
    // @ts-ignore
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('https://myapp.vercel.app/api/log');
  });
});
console.log('logger.test.ts executed');
