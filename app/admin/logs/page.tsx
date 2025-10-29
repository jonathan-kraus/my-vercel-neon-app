import { LogsTable } from '@/app/components/logs-table';
import { neon } from '@neondatabase/serverless';
import { type Log } from '@prisma/client';
import { z } from 'zod';

const LogSchema = z.object({
  id: z.string(),
  severity: z.string(),
  source: z.string(),
  message: z.string(),
  requestId: z.string().nullable(),
  metadata: z.any(),
  timestamp: z.coerce.date(), // or z.string() if not parsed yet
});

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 50;
  const level = params.level as string | undefined;
  const module = params.module as string | undefined;
  const requestId = params.requestId as string | undefined;
  const offset = (page - 1) * limit;

  const sql = neon(process.env.DATABASE_URL!);
  const logsRaw = await sql`
  SELECT id, severity, source, message, request_id, metadata, timestamp
  FROM logs
  ORDER BY created_at DESC
  LIMIT ${limit} OFFSET ${offset} as unknown as Log[]
`;
  //const logs = LogSchema.array().parse(logsRaw);
  let logs: Log[];
  // Build query based on filters
  //let logs;
  let totalCount;

  if (level && module && requestId) {
    logs = (await sql`
      SELECT * FROM logs 
      WHERE level = ${level} AND module = ${module} AND request_id = ${requestId}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Log[];
    const count = await sql`
      SELECT COUNT(*) as count FROM logs 
      WHERE level = ${level} AND module = ${module} AND request_id = ${requestId}
    `;
    totalCount = Number(count[0].count);
  } else if (level && module) {
    logs = (await sql`
      SELECT * FROM logs 
      WHERE level = ${level} AND module = ${module}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Log[];
    const count = await sql`
      SELECT COUNT(*) as count FROM logs 
      WHERE level = ${level} AND module = ${module}
    `;
    totalCount = Number(count[0].count);
  } else if (level && requestId) {
    logs = (await sql`
      SELECT * FROM logs 
      WHERE level = ${level} AND request_id = ${requestId}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Log[];
    const count = await sql`
      SELECT COUNT(*) as count FROM logs 
      WHERE level = ${level} AND request_id = ${requestId}
    `;
    totalCount = Number(count[0].count);
  } else if (module && requestId) {
    logs = (await sql`
      SELECT * FROM logs 
      WHERE module = ${module} AND request_id = ${requestId}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Log[];
    const count = await sql`
      SELECT COUNT(*) as count FROM logs 
      WHERE module = ${module} AND request_id = ${requestId}
    `;
    totalCount = Number(count[0].count);
  } else if (level) {
    logs = await sql`
      SELECT * FROM logs 
      WHERE level = ${level}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset} as unknown as Log[]
    `;
    const count = await sql`SELECT COUNT(*) as count FROM logs WHERE level = ${level}`;
    totalCount = Number(count[0].count);
  } else if (module) {
    logs = (await sql`
      SELECT * FROM logs 
      WHERE module = ${module}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Log[];
    const count = await sql`SELECT COUNT(*) as count FROM logs WHERE module = ${module}`;
    totalCount = Number(count[0].count);
  } else if (requestId) {
    logs = (await sql`
      SELECT * FROM logs 
      WHERE request_id = ${requestId}
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Log[];
    const count = await sql`SELECT COUNT(*) as count FROM logs WHERE request_id = ${requestId}`;
    totalCount = Number(count[0].count);
  } else {
    logs = (await sql`
      SELECT * FROM logs 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `) as unknown as Log[];
    const count = await sql`SELECT COUNT(*) as count FROM logs as unknown as Log[]`;
    totalCount = Number(count[0].count);
  }

  // Get unique modules and levels for filters
  const modules =
    await sql`SELECT DISTINCT module FROM logs WHERE module IS NOT NULL ORDER BY module`;
  const levels = await sql`SELECT DISTINCT level FROM logs ORDER BY level`;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-slate-400">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-semibold text-foreground">Application Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and debug your application with detailed log entries
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <LogsTable
          logs={logs}
          totalCount={totalCount}
          currentPage={page}
          limit={limit}
          modules={modules.map((m) => m.module)}
          levels={levels.map((l) => l.level)}
          currentLevel={level}
          currentModule={module}
          currentRequestId={requestId}
        />
      </div>
    </div>
  );
}
