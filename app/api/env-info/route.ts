import { NextResponse } from 'next/server';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';
import { neon } from '@neondatabase/serverless';

console.log('DB module loaded');
export async function checkDbConnection() {
  const requestId = generateUUID();
  if (!process.env.DATABASE_URL) {
    return 'No DATABASE_URL environment variable';
  }
  try {
    const log = createLogger('db.ts', requestId);

    const sql = neon(process.env.DATABASE_URL);

    const countWeatherLog = await sql`SELECT COUNT(*)::int as count FROM "WeatherLog"`;
    await log.info('env-info route', { CWL: countWeatherLog[0].count });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    return 'Database not connected';
  }
}
console.log('Env-info route checking DB connection');
checkDbConnection();
export async function GET() {
  const requestId = generateUUID();
  const log = createLogger('app/api/env-info/route.ts', requestId);

  try {
    // Parse database URL to get host (safely)
    let dbHost = 'N/A';
    let dbName = 'N/A';
    let weatherLogCount = null;
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        dbHost = url.hostname;
        dbName = url.pathname.slice(1); // Remove leading slash
        // Query WeatherLog count
        const sql = neon(process.env.DATABASE_URL);
        const result = await sql`SELECT COUNT(*)::int as count FROM "WeatherLog"`;
        weatherLogCount = result[0]?.count ?? null;
      } catch {
        dbHost = 'Unable to parse';
        weatherLogCount = null;
      }
    }

    const envInfo = {
      deploymentUrl: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : typeof window !== 'undefined'
          ? window.location.origin
          : 'localhost',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      vercelRegion: process.env.VERCEL_REGION || 'N/A',
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 7) || 'N/A',
      gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'N/A',
      gitCommitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || 'N/A',
      VERCEL_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || 'N/A',
      VERCEL_GIT_PROVIDER: process.env.VERCEL_GIT_PROVIDER || 'N/A',
      VERCEL_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG || 'N/A',
      VERCEL_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER || 'N/A',
      databaseHost: dbHost,
      databaseName: dbName,
      weatherLogCount,
    };

    await log.info('Environment info fetched', {
      environment: envInfo.environment,
      region: envInfo.vercelRegion,
      dbHost,
      gitSha: envInfo.gitCommitSha,
      CWL: weatherLogCount,
    });

    return NextResponse.json(envInfo);
  } catch (error) {
    try {
      await log.error('Error fetching environment info', { error: String(error) });
    } catch {
      // Fallback if logging fails
      console.warn('[env-info] Failed to log error:', error);
    }
    return NextResponse.json({ error: 'Failed to fetch environment info' }, { status: 500 });
  }
}
