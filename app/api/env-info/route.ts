import { NextResponse } from 'next/server';
import { generateUUID } from '@/uuidj';
import { createLogger } from '@/app/utils/logger';

const requestid = generateUUID();

const log = createLogger('app/api/env-info/route.ts', requestid);
log.info(`[${requestid}] app/api/env-info/route.ts accessed`);
export async function GET() {
  try {
    // Parse database URL to get host (safely)
    let dbHost = 'N/A';
    let dbName = 'N/A';
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        dbHost = url.hostname;
        dbName = url.pathname.slice(1); // Remove leading slash
      } catch {
        dbHost = 'Unable to parse';
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
    };

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
