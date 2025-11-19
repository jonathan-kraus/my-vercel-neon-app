import { NextResponse } from 'next/server';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

export async function GET(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/metadata/route.ts', requestId);

  try {
    const result: Record<string, string | null> = {
      host: 'N/A',
      database: 'N/A',
      username: 'N/A',
      branch: 'N/A',
      neonConsoleUrl: 'https://console.neon.tech',
    };

    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        result.host = url.hostname;
        result.database = url.pathname ? url.pathname.replace(/^\//, '') : 'N/A';
        result.username = url.username || 'N/A';

        // Heuristic: Neon projects often embed branch/project info in hostname.
        // e.g. <branch>.<project>.<region>.neon.tech
        const hostParts = url.hostname.split('.');
        if (hostParts.length >= 4 && hostParts.includes('neon')) {
          // assume first part is branch
          result.branch = hostParts[0];
        }
      } catch (err) {
        result.host = 'Unable to parse DATABASE_URL';
      }
    }

    await log.info('Neon metadata fetched', { host: result.host, db: result.database });

    return NextResponse.json(result);
  } catch (error) {
    try {
      await createLogger('app/api/neon/metadata/route.ts', requestId).error('Failed', {
        error: String(error),
      });
    } catch {}
    return NextResponse.json({ error: 'Failed to fetch neon metadata' }, { status: 500 });
  }
}
