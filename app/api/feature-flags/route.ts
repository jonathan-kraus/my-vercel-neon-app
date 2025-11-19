import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// Cache for server-side requests
let cachedFlags: Record<string, boolean> = {};
let lastFetch = 0;
const CACHE_TTL = 60000; // 60 seconds

export async function GET() {
  try {
    const now = Date.now();

    // Return cached flags if still fresh
    if (now - lastFetch < CACHE_TTL && Object.keys(cachedFlags).length > 0) {
      return NextResponse.json(cachedFlags);
    }

    // Fetch from database
    const flags = await db.featureFlag.findMany({
      select: { name: true, enabled: true },
    });

    cachedFlags = flags.reduce(
      (acc: Record<string, boolean>, f: { name: string; enabled: boolean }) => ({
        ...acc,
        [f.name]: f.enabled,
      }),
      {}
    );
    lastFetch = now;

    return NextResponse.json(cachedFlags);
  } catch (error) {
    console.error('Failed to fetch feature flags:', error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, enabled } = await req.json();

    if (!name || typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const updated = await db.featureFlag.update({
      where: { name },
      data: { enabled },
    });

    // Clear cache
    cachedFlags = {};
    lastFetch = 0;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update feature flag:', error);
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 });
  }
}
