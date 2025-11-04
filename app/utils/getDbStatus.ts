'use server';

import { db } from '@/app/lib/db';
import { logEvent } from '../lib/abslog';
import { generateUUID } from '../../uuidj';

const prisma = db; // For clarity in this file
const requestId = generateUUID();

async function getLastDatabaseActivity() {
  try {
    // Check current active connections
    const activeConnections = (await prisma.$queryRaw`
      SELECT count(*) as active_connections,
             max(state_change) as last_state_change,
             max(backend_start) as last_backend_start
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid <> pg_backend_pid()
        AND state IS NOT NULL
    `) as {
      active_connections: bigint;
      last_state_change: Date | null;
      last_backend_start: Date | null;
    }[];

    // Check last modification times from user tables
    const tableActivity = (await prisma.$queryRaw`
      SELECT max(last_vacuum) as last_vacuum,
             max(last_autovacuum) as last_autovacuum,
             max(last_analyze) as last_analyze,
             max(last_autoanalyze) as last_autoanalyze,
             max(n_tup_ins + n_tup_upd + n_tup_del) as total_operations
      FROM pg_stat_user_tables
    `) as {
      last_vacuum: Date | null;
      last_autovacuum: Date | null;
      last_analyze: Date | null;
      last_autoanalyze: Date | null;
      total_operations: bigint | null;
    }[];

    // Get the most recent activity timestamp
    const timestamps = [
      activeConnections[0]?.last_state_change,
      activeConnections[0]?.last_backend_start,
      tableActivity[0]?.last_vacuum,
      tableActivity[0]?.last_autovacuum,
      tableActivity[0]?.last_analyze,
      tableActivity[0]?.last_autoanalyze,
    ].filter(Boolean) as Date[];

    const lastActivity =
      timestamps.length > 0 ? new Date(Math.max(...timestamps.map((d) => d.getTime()))) : null;

    return {
      activeConnections: Number(activeConnections[0]?.active_connections || 0),
      lastActivity,
      lastVacuum: tableActivity[0]?.last_vacuum,
      lastAutoVacuum: tableActivity[0]?.last_autovacuum,
      totalOperations: Number(tableActivity[0]?.total_operations || 0),
    };
  } catch (error) {
    console.error('Error getting database activity:', error);
    return {
      activeConnections: 0,
      lastActivity: null,
      lastVacuum: null,
      lastAutoVacuum: null,
      totalOperations: 0,
    };
  }
}

export async function getDbStatus() {
  console.log(`[getDbStatus] [${requestId}] Checking database status...`);

  const start = Date.now();
  const [version, postCount, latestPost, logCount, lastActivity] = await Promise.all([
    prisma.$queryRaw`SELECT version()`,
    prisma.post.count({ where: { authorId: { not: 1101 } } }),
    prisma.post.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.log.count(),
    getLastDatabaseActivity(),
  ]);
  const latencyMs = Date.now() - start;
  console.log(`[getDbStatus] [${requestId}] Start logging database status...`);
  await logEvent({
    source: 'getDbStatus',
    message: 'Database status retrieved',
    requestId,
    metadata: { userAction: 'fetch' },
  });
  //await triggerEmail('JDB Status', requestId, `Database Status Update`, message);

  console.log(`[getDbStatus] [${requestId}] Database status logged.`);
  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    latestPostDate: latestPost?.createdAt || null,
    latestPostTitle: latestPost?.title || 'No Title',
    latestPostContent: latestPost?.content || 'No Content',
    logCount,
    latencyMs,
    lastActivity,
  };
}
