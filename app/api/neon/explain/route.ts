import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

type ExplainRequest = {
  query?: string;
};

export async function POST(request: Request) {
  const headerId = request.headers.get('x-request-id');
  const requestId = headerId || generateUUID();
  const log = createLogger('app/api/neon/explain/route.ts', requestId);

  try {
    const body = (await request.json()) as ExplainRequest;
    const query = (body.query || '').trim();

    if (!query) {
      await log.error('Explain called with empty query');
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Reject queries with Prisma parameter placeholders ($1, $2, etc.) as they cannot be executed without parameters
    if (/\$\d+/g.test(query)) {
      await log.warn('Explain rejected query with parameters', { preview: query.slice(0, 200) });
      return NextResponse.json(
        {
          error:
            'Cannot explain parameterized queries. Please use actual values or SELECT from pg_stat_statements.',
        },
        { status: 400 }
      );
    }

    // Basic safety: only allow SELECT queries to avoid data modification.
    const firstWord = query.split(/\s+/)[0]?.toLowerCase() || '';
    if (firstWord !== 'select' && !query.toLowerCase().startsWith('with')) {
      await log.warn('Explain rejected non-SELECT query', { preview: query.slice(0, 200) });
      return NextResponse.json(
        { error: 'Only SELECT queries are allowed for explain' },
        { status: 400 }
      );
    }

    await log.info('Running EXPLAIN ANALYZE for query preview', { preview: query.slice(0, 200) });

    // Run EXPLAIN (ANALYZE, BUFFERS) but be mindful this actually executes the query.
    // We protect by restricting to SELECT/WITH and rely on DB role permissions.
    // Use $queryRawUnsafe because the query is dynamic after validation.
    const sql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${query}`;

    const rows = await (db as any).$queryRawUnsafe(sql);

    // rows often is array of objects where first col contains plan lines.
    const planLines: string[] = rows.map((r: any) => {
      try {
        const val = Object.values(r)[0];
        return String(val);
      } catch {
        return String(r);
      }
    });

    await log.info('Explain completed', { lines: planLines.length });

    return NextResponse.json({ plan: planLines });
  } catch (error) {
    try {
      await createLogger('app/api/neon/explain/route.ts', requestId).error('Explain failed', {
        error: String(error),
      });
    } catch (logErr) {
      // If logging fails, surface to server console for diagnostics
      console.warn('Failed to log explain error', logErr);
    }
    return NextResponse.json({ error: 'Explain failed', details: String(error) }, { status: 500 });
  }
}
