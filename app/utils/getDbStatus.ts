'use server';

import { db } from '@/app/lib/db';
import { createLogger } from './logger';
import { generateUUID } from '@/uuidj';

/**
 * Extract AWS region from Neon database host
 * Example: ep-twilight-sunset-adx2o0ca-pooler.c-2.us-east-1.aws.neon.tech -> us-east-1
 */
function extractRegionFromDbHost(): string {
  try {
    if (!process.env.DATABASE_URL) return 'Unknown';
    const url = new URL(process.env.DATABASE_URL);
    const host = url.hostname;

    // Match pattern like ".us-east-1.aws.neon.tech" or ".eu-west-1.aws.neon.tech"
    const regionMatch = host.match(/\.(us|eu|ap|ca|sa|me|af)-([a-z]+)-(\d+)\.aws\.neon\.tech$/);
    if (regionMatch) {
      return `${regionMatch[1]}-${regionMatch[2]}-${regionMatch[3]}`;
    }
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function getLastDatabaseActivity() {
  try {
    // Check current active connections
    const activeConnections = (await db.$queryRaw`
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
    const tableActivity = (await db.$queryRaw`
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
    // Note: Can't use logger here as we're in a nested function without requestId
    console.warn('[getDbStatus] Error getting database activity:', error);
    return {
      activeConnections: 0,
      lastActivity: null,
      lastVacuum: null,
      lastAutoVacuum: null,
      totalOperations: 0,
    };
  }
}

export async function getDbStatus(requestId?: string) {
  if (!requestId) requestId = generateUUID();
  const log = createLogger('app/utils/getDbStatus.ts', requestId);

  const start = Date.now();
  const [version, postCount, latestPost, logCount, weatherHourlyCount, slowCount, lastActivity] =
    await Promise.all([
      db.$queryRaw`SELECT version()`,
      db.post.count({ where: { authorId: { not: 11501 } } }),
      db.post.findFirst({ orderBy: { createdAt: 'desc' } }),
      db.log.count(),
      db.weatherHourly.count(),
      db.slowQueryHistory.count(),
      getLastDatabaseActivity(),
    ]);
  const latencyMs = Date.now() - start;

  const region = extractRegionFromDbHost();

  await log.info('Database status retrieved', {
    latencyMs,
    postCount,
    logCount,
    slowCount,
    weatherHourlyCount,
    activeConnections: lastActivity.activeConnections,
    region,
  });
  return {
    version: (version as { version: string }[])[0].version,
    postCount,
    latestPostDate: latestPost?.createdAt || null,
    latestPostTitle: latestPost?.title || 'No Title',
    latestPostContent: latestPost?.content || 'No Content',
    logCount,
    weatherHourlyCount,
    latencyMs,
    lastActivity,
    region,
  };
}
